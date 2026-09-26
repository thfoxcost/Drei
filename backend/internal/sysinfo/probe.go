package sysinfo

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"
	"syscall"
	"time"

	"backend/internal/config"
	"backend/internal/database"
)

// Service states reported to the client. These strings are part of the public
// /api/status contract.
const (
	stateOnline   = "online"
	stateDegraded = "degraded"
	stateOffline  = "offline"
)

// ServiceStatus is one row of the service list.
type ServiceStatus struct {
	Name    string `json:"name"`
	Status  string `json:"status"`
	Latency int64  `json:"latency"`
}

// Thresholds separating a healthy dependency from a slow or broken one.
const (
	frontendOnline   = 500 * time.Millisecond
	frontendDegraded = 1500 * time.Millisecond
	databaseOnline   = 50 * time.Millisecond
	databaseDegraded = 500 * time.Millisecond
	storageOnline    = 50 * time.Millisecond
	storageDegraded  = 500 * time.Millisecond

	frontendTimeout = 3 * time.Second
	databaseTimeout = 2 * time.Second

	// frontendProbeInterval is deliberately slower than the sampler tick: the
	// reported memory is a slowly moving figure, so re-reading it on every tick
	// would buy nothing.
	frontendProbeInterval = 30 * time.Second
)

// memoryPath is the client server's own memory-usage endpoint. The backend
// cannot read another process's memory, so the client publishes it.
const memoryPath = "/api/memory"

// frontendClient probes the client server. Redirects are not followed: any
// redirect is already proof the frontend is serving.
var frontendClient = &http.Client{
	Timeout: frontendTimeout,
	CheckRedirect: func(*http.Request, []*http.Request) error {
		return http.ErrUseLastResponse
	},
}

// prober measures the services, reusing the frontend result between probes.
// Only the sampler goroutine touches it, so it needs no locking.
type prober struct {
	frontend   ServiceStatus
	client     *ClientProcess
	frontendAt time.Time
}

// services returns one row per dependency. The backend reports itself online
// unconditionally: if this code is running, the backend answered.
func (p *prober) services() []ServiceStatus {
	now := time.Now()

	if p.frontendAt.IsZero() || now.Sub(p.frontendAt) >= frontendProbeInterval {
		p.frontend, p.client = probeFrontend()
		p.frontendAt = now
	}

	return []ServiceStatus{
		p.frontend,
		{Name: "Backend", Status: stateOnline, Latency: 0},
		probeDatabase(),
		probeStorage(),
	}
}

// ClientProcess is the client server's reported memory usage.
type ClientProcess struct {
	RSSBytes       uint64 `json:"rssBytes"`
	HeapUsedBytes  uint64 `json:"heapUsedBytes"`
	HeapTotalBytes uint64 `json:"heapTotalBytes"`
}

// probeFrontend checks that the TanStack Start server is up and reads the
// memory usage it publishes about itself.
//
// It runs on the same host as the backend in every supported setup, because
// the backend already depends on config.App.ClientURL to validate sessions.
// The memory reading is optional: a client that is up but does not expose the
// endpoint still counts as online, it just reports no usage.
func probeFrontend() (ServiceStatus, *ClientProcess) {
	service := ServiceStatus{Name: "Frontend"}

	target := strings.TrimSuffix(config.App.ClientURL, "/") + memoryPath

	start := time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), frontendTimeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, target, nil)
	if err != nil {
		service.Status = stateOffline
		return service, nil
	}

	resp, err := frontendClient.Do(req)

	elapsed := time.Since(start)

	var client *ClientProcess

	if resp != nil {
		// Only a success carries a body worth reading. On anything else the
		// response is drained just enough to reuse the connection.
		if resp.StatusCode == http.StatusOK {
			var payload ClientProcess

			if json.NewDecoder(io.LimitReader(resp.Body, 8<<10)).Decode(&payload) == nil {
				client = &payload
			}
		} else {
			io.Copy(io.Discard, io.LimitReader(resp.Body, 1))
		}

		resp.Body.Close()
	}

	service.Latency = elapsed.Milliseconds()

	if err != nil {
		service.Status = stateOffline
		return service, nil
	}

	if resp.StatusCode >= http.StatusInternalServerError {
		service.Status = stateOffline
		return service, nil
	}

	service.Status = stateFor(elapsed, frontendOnline, frontendDegraded)

	return service, client
}

// probeDatabase pings Postgres and times the round trip.
func probeDatabase() ServiceStatus {
	service := ServiceStatus{Name: "Database"}

	if database.DB == nil {
		service.Status = stateOffline
		return service
	}

	ctx, cancel := context.WithTimeout(context.Background(), databaseTimeout)
	defer cancel()

	start := time.Now()
	err := database.DB.Ping(ctx)
	elapsed := time.Since(start)

	service.Latency = elapsed.Milliseconds()

	if err != nil {
		service.Status = stateOffline
		return service
	}

	service.Status = stateFor(elapsed, databaseOnline, databaseDegraded)

	return service
}

// probeStorage confirms REPOS_PATH exists and is writable. A git host that
// cannot write its repository directory is down even though every HTTP
// dependency answers.
func probeStorage() ServiceStatus {
	service := ServiceStatus{Name: "Storage"}

	start := time.Now()

	if err := checkReposDir(); err != nil {
		service.Latency = time.Since(start).Milliseconds()
		service.Status = stateOffline
		return service
	}

	elapsed := time.Since(start)

	service.Latency = elapsed.Milliseconds()
	service.Status = stateFor(elapsed, storageOnline, storageDegraded)

	return service
}

// checkReposDir verifies REPOS_PATH is a directory the process can write to,
// using a real write rather than a permission check so that read-only mounts
// and full disks are both caught.
func checkReposDir() error {
	info, err := os.Stat(config.App.ReposPath)
	if err != nil {
		return err
	}

	if !info.IsDir() {
		return &os.PathError{
			Op:   "stat",
			Path: config.App.ReposPath,
			Err:  syscall.ENOTDIR,
		}
	}

	probe, err := os.CreateTemp(config.App.ReposPath, ".drei-health-*")
	if err != nil {
		return err
	}

	name := probe.Name()

	probe.Close()

	if err := os.Remove(name); err != nil {
		return err
	}

	return nil
}

// stateFor classifies a healthy dependency by how long it took to answer.
func stateFor(elapsed, online, degraded time.Duration) string {
	switch {
	case elapsed <= online:
		return stateOnline
	case elapsed <= degraded:
		return stateDegraded
	default:
		return stateOffline
	}
}

// Package sysinfo samples live host and process metrics in the background and
// exposes the latest reading as an immutable snapshot.
//
// Sampling happens on a timer instead of per request so that the more expensive
// measurements (a filesystem stat, an HTTP round trip to the client server, a
// database ping) cost the same whether one client polls or fifty do, and so
// that CPU utilization is averaged over a fixed interval rather than sampled
// at unpredictable moments.
package sysinfo

import (
	"context"
	"fmt"
	"os"
	"runtime"
	"runtime/debug"
	"sync/atomic"
	"time"

	"backend/internal/config"

	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/host"
	"github.com/shirou/gopsutil/v4/load"
	"github.com/shirou/gopsutil/v4/process"
)

// DefaultInterval is how often Run refreshes the snapshot.
const DefaultInterval = 5 * time.Second

// startedAt is the process boot time, used to report our own uptime.
var startedAt = time.Now()

// latest holds the most recent successful reading. Readers load it without
// locking, so a poll never blocks behind the sampler.
var latest atomic.Pointer[Snapshot]

// Snapshot is one complete reading of every service and metric.
type Snapshot struct {
	Services []ServiceStatus
	System   SystemMetrics
	// Client is the client server's own memory usage, or nil when it could
	// not be read.
	Client *ClientProcess
}

// SystemMetrics describes the host and the backend process.
type SystemMetrics struct {
	Uptime        string               `json:"uptime"`
	HostUptime    string               `json:"hostUptime"`
	Version       string               `json:"version"`
	Environment   string               `json:"environment"`
	CPU           CPUMetrics           `json:"cpu"`
	ProcessMemory ProcessMemoryMetrics `json:"processMemory"`
	LastUpdated   time.Time            `json:"lastUpdated"`
}

// CPUMetrics reports host CPU utilization over the last sample interval,
// together with the load averages and the logical CPU count.
type CPUMetrics struct {
	Percent float64     `json:"percent"`
	Count   int         `json:"count"`
	Load    LoadMetrics `json:"load"`
}

// LoadMetrics holds the 1, 5 and 15 minute load averages.
type LoadMetrics struct {
	One     float64 `json:"1"`
	Five    float64 `json:"5"`
	Fifteen float64 `json:"15"`
}

// ProcessMemoryMetrics reports the backend process footprint in mebibytes.
type ProcessMemoryMetrics struct {
	RSS        int64  `json:"rss"`
	Heap       int64  `json:"heap"`
	Goroutines int    `json:"goroutines"`
	Unit       string `json:"unit"`
}

// Run samples every metric on the given interval until ctx is cancelled. It
// takes a first reading immediately so callers never observe an empty
// snapshot. Run is intended to be started in its own goroutine.
func Run(ctx context.Context, interval time.Duration) {
	if interval <= 0 {
		interval = DefaultInterval
	}

	var previous SystemMetrics
	var services prober

	store := func() {
		previous = collectSystem(previous)

		rows := services.services()

		latest.Store(&Snapshot{
			Services: rows,
			System:   previous,
			Client:   services.client,
		})
	}

	store()

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			store()
		}
	}
}

// Current returns the latest snapshot, or nil before the first reading.
func Current() *Snapshot {
	return latest.Load()
}

// collectSystem gathers one reading of every metric. A collector that fails
// falls back to the previous reading for that section rather than reporting a
// zero: a stale number is more honest than a fabricated one.
func collectSystem(previous SystemMetrics) SystemMetrics {
	now := time.Now()

	next := SystemMetrics{
		Uptime:      formatUptime(now.Sub(startedAt)),
		Version:     buildVersion(),
		Environment: config.App.Environment,
		LastUpdated: now,
	}

	if seconds, err := host.Uptime(); err == nil {
		next.HostUptime = formatUptime(time.Duration(seconds) * time.Second)
	} else {
		next.HostUptime = previous.HostUptime
	}

	if v, err := collectCPU(); err == nil {
		next.CPU = v
	} else {
		next.CPU = previous.CPU
	}

	if v, err := collectProcessMemory(); err == nil {
		next.ProcessMemory = v
	} else {
		next.ProcessMemory = previous.ProcessMemory
	}

	return next
}

// collectCPU asks for utilization since the previous call. gopsutil keeps the
// earlier reading internally, so the regular sampler interval is what makes
// this an average over that window rather than an instantaneous spike.
func collectCPU() (CPUMetrics, error) {
	percents, err := cpu.Percent(0, false)
	if err != nil {
		return CPUMetrics{}, err
	}

	metrics := CPUMetrics{Count: 1}

	if len(percents) > 0 {
		metrics.Percent = percents[0]
	}

	if count, err := cpu.Counts(true); err == nil {
		metrics.Count = count
	}

	if avg, err := load.Avg(); err == nil {
		metrics.Load = LoadMetrics{
			One:     avg.Load1,
			Five:    avg.Load5,
			Fifteen: avg.Load15,
		}
	}

	return metrics, nil
}

func collectProcessMemory() (ProcessMemoryMetrics, error) {
	self, err := process.NewProcess(int32(os.Getpid()))
	if err != nil {
		return ProcessMemoryMetrics{}, err
	}

	info, err := self.MemoryInfo()
	if err != nil {
		return ProcessMemoryMetrics{}, err
	}

	var stats runtime.MemStats

	runtime.ReadMemStats(&stats)

	return ProcessMemoryMetrics{
		RSS:        toMiB(info.RSS),
		Heap:       toMiB(stats.HeapAlloc),
		Goroutines: runtime.NumGoroutine(),
		Unit:       "MB",
	}, nil
}

// buildVersion reports the module version recorded at build time. Local builds
// carry no semantic version, so those report as "devel" rather than an
// invented number.
func buildVersion() string {
	info, ok := debug.ReadBuildInfo()
	if !ok || info.Main.Version == "" {
		return "devel"
	}

	if info.Main.Version == "(devel)" {
		return "devel"
	}

	return info.Main.Version
}

func toMiB(bytes uint64) int64 {
	const mib = 1024 * 1024
	return int64(bytes / mib)
}

// formatUptime renders a duration the way the widget displays it, dropping
// leading units that are still zero.
func formatUptime(d time.Duration) string {
	if d < 0 {
		d = 0
	}

	totalMinutes := int(d.Minutes())
	days := totalMinutes / (60 * 24)
	hours := (totalMinutes / 60) % 24
	minutes := totalMinutes % 60

	switch {
	case days > 0:
		return fmt.Sprintf("%dd %02dh %02dm", days, hours, minutes)
	case hours > 0:
		return fmt.Sprintf("%02dh %02dm", hours, minutes)
	default:
		return fmt.Sprintf("%02dm", minutes)
	}
}

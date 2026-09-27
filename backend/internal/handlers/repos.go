package handlers

import (
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/gitrepo"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// CreateRepoRequest is the wire format accepted by POST /api/repos.
//
// The identity fields (UserId, Useremail, Username) are retained only so the
// shape of existing clients keeps decoding. They are ignored: the owning user
// is always resolved from the session cookie, never from the request body.
type CreateRepoRequest struct {
	UserId        string `json:"userid"`
	Useremail     string `json:"useremail"`
	Username      string `json:"username"`
	Reponame      string `json:"reponame"`
	Description   string `json:"description"`
	Visibility    bool   `json:"visibility"`
	DefaultBranch string `json:"defaultbranch"`
	Avatar        string `json:"avatar"`
}

func repoExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}

func createRepoFiles(userPath, repoPath string) error {
	gitrepo.CreateReposDIR(config.App.ReposPath)
	gitrepo.CreateUserDIR(userPath)

	if err := gitrepo.Init(repoPath); err != nil {
		return err
	}

	fmt.Println("[OK] Repository created:", repoPath)

	return nil
}

// errRepositoryExists signals a namespace/name collision on disk.
var errRepositoryExists = errors.New("repository already exists")

// createBareRepository is the shared implementation behind personal and
// organization repository creation. namespace is the disk/URL owner (a
// username or an organization slug), ownerID is the creating user's ID, and
// organizationID is nil for personal repositories.
func createBareRepository(namespace, ownerID, creatorName string, organizationID *int64, name, description string, visibility bool, avatar *string) (int64, error) {
	// Re-validate here rather than trusting callers: this is the single
	// function that turns a namespace and a name into a filesystem path, and
	// it serves the personal, organization and fork creation paths.
	if !ValidNamespace(namespace) {
		return 0, fmt.Errorf("invalid owner namespace %q", namespace)
	}

	if !gitrepo.ValidRepoName(name) {
		return 0, fmt.Errorf("invalid repository name %q", name)
	}

	userPath := filepath.Join(config.App.ReposPath, namespace)
	repoPath := filepath.Join(userPath, name+".git")

	if repoExists(repoPath) {
		return 0, errRepositoryExists
	}

	if err := createRepoFiles(userPath, repoPath); err != nil {
		return 0, err
	}

	base := database.Repository{
		OwnerID:       ownerID,
		Owner:         namespace,
		Name:          name,
		Description:   description,
		Visibility:    visibility,
		Path:          repoPath,
		DefaultBranch: "main",
	}

	var repoID int64

	var err error

	if organizationID != nil {
		repoID, err = database.CreateOrganizationRepository(base, *organizationID)
	} else {
		repoID, err = database.CreateRepository(base)
	}

	if err != nil {
		// Remove the repository from disk if the database insert failed.
		_ = os.RemoveAll(repoPath)

		return 0, err
	}

	// Add the repository creator as the first contributor.
	if err := database.CreateContributor(repoID, database.Contributor{
		ID:       ownerID,
		Username: creatorName,
		Avatar:   avatar,
	}); err != nil {
		// Remove the repository from disk if the contributor insert failed.
		_ = os.RemoveAll(repoPath)

		return 0, err
	}

	return repoID, nil
}

// CreateRepo godoc
//
//	@Summary		Create a new repository
//	@Description	Creates a new bare Git repository and stores it in the database
//	@Tags			Repositories
//	@Accept			json
//	@Produce		json
//	@Param			repo	body		CreateRepoRequest	true	"Repository details"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		409		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Router			/repos [post]
func CreateRepo(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "POST")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	// The repository is always owned by the authenticated session. Identity
	// supplied in the body is not trusted: an unauthenticated caller could
	// otherwise create a repository attributed to any user id or username.
	user, err := authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	var current CreateRepoRequest

	if err := json.NewDecoder(r.Body).Decode(&current); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Normalize the repository name so the stored owner/name always matches
	// the URL namespace (no leading/trailing whitespace divergence).
	current.Reponame = strings.TrimSpace(current.Reponame)

	if !gitrepo.ValidRepoName(current.Reponame) {
		writeError(w, http.StatusBadRequest, "invalid repository name")
		return
	}

	// Add the repository creator as the first contributor.
	var avatar *string

	if current.Avatar != "" {
		avatar = &current.Avatar
	}

	if _, err := createBareRepository(user.Name, user.ID, user.Name, nil, current.Reponame, current.Description, current.Visibility, avatar); err != nil {
		if errors.Is(err, errRepositoryExists) {
			writeError(w, http.StatusConflict, "Repository already exists")
			return
		}

		// Disk cleanup on failure happens inside createBareRepository.
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, map[string]any{
		"success": true,
		"message": "Repository created successfully",
		"repository": map[string]any{
			"owner": user.Name,
			"name":  current.Reponame,
		},
	})
}

type UpdateRepoRequest struct {
	Name                string `json:"name"`
	Description         string `json:"description"`
	DefaultBranch       string `json:"defaultBranch"`
	RenameDefaultBranch string `json:"renameDefaultBranch"`
	Website             string `json:"website"`
}

func updateRepository(w http.ResponseWriter, r *http.Request, owner, repo string) {
	writeErr := func(status int, msg string) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   msg,
		})
	}

	var req UpdateRepoRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(http.StatusBadRequest, "invalid request body")
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Description = strings.TrimSpace(req.Description)
	req.DefaultBranch = strings.TrimSpace(req.DefaultBranch)
	req.RenameDefaultBranch = strings.TrimSpace(req.RenameDefaultBranch)
	req.Website = strings.TrimSpace(req.Website)

	info, err := database.GetRepository(owner, repo)
	if err != nil {
		writeErr(http.StatusNotFound, "repository not found")
		return
	}

	// Organization repositories require an owner/admin role to edit.
	if !authorizeOrgRepo(w, r, info, "admin") {
		return
	}

	currentDefault, err := gitrepo.DefaultBranch(owner, repo)
	if err != nil {
		writeErr(http.StatusInternalServerError, err.Error())
		return
	}

	// Rename the current default branch first so the rename always applies to
	// the branch HEAD points to when the request arrives.
	if req.RenameDefaultBranch != "" && req.RenameDefaultBranch != currentDefault {
		if err := gitrepo.RenameDefaultBranch(owner, repo, req.RenameDefaultBranch); err != nil {
			writeErr(http.StatusBadRequest, err.Error())
			return
		}

		currentDefault = req.RenameDefaultBranch
	}

	// Switch the default branch (HEAD) to an existing branch.
	if req.DefaultBranch != "" && req.DefaultBranch != currentDefault {
		if err := gitrepo.SetDefaultBranch(owner, repo, req.DefaultBranch); err != nil {
			writeErr(http.StatusBadRequest, err.Error())
			return
		}

		currentDefault = req.DefaultBranch
	}

	// Rename the repository itself (bare repo directory + database row).
	if req.Name != "" && req.Name != repo {
		if err := gitrepo.RenameRepository(owner, repo, req.Name); err != nil {
			writeErr(http.StatusBadRequest, err.Error())
			return
		}

		newPath := filepath.Join(config.App.ReposPath, owner, req.Name+".git")

		if err := database.UpdateRepositoryName(owner, repo, req.Name, newPath); err != nil {
			writeErr(http.StatusInternalServerError, err.Error())
			return
		}

		// Keep the retained backup's stored path in sync (the bundle file
		// itself was already moved by RenameRepository).
		if err := database.UpdateBackupPath(info.ID, gitrepo.BackupFilePath(owner, req.Name)); err != nil {
			writeErr(http.StatusInternalServerError, err.Error())
			return
		}

		// Keep the stored logo in sync so its public URL still works.
		if info.Logo != "" {
			if err := gitrepo.RenameLogo(owner, repo, req.Name, info.Logo); err != nil {
				writeErr(http.StatusInternalServerError, err.Error())
				return
			}

			newLogo := fmt.Sprintf("%s/%s%s", owner, req.Name, filepath.Ext(info.Logo))

			if err := database.UpdateRepositoryLogo(owner, req.Name, newLogo); err != nil {
				writeErr(http.StatusInternalServerError, err.Error())
				return
			}
		}

		repo = req.Name
	}

	if err := database.UpdateRepositoryDescription(owner, repo, req.Description); err != nil {
		writeErr(http.StatusInternalServerError, err.Error())
		return
	}

	if err := database.UpdateRepositoryWebsite(owner, repo, req.Website); err != nil {
		writeErr(http.StatusInternalServerError, err.Error())
		return
	}

	if err := database.UpdateRepositoryDefaultBranch(owner, repo, currentDefault); err != nil {
		writeErr(http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]any{
		"success":       true,
		"name":          req.Name,
		"description":   req.Description,
		"defaultBranch": currentDefault,
	})
}

func deleteRepository(w http.ResponseWriter, r *http.Request, owner, repo string) {
	writeErr := func(status int, msg string) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   msg,
		})
	}

	info, err := database.GetRepository(owner, repo)
	if err != nil {
		writeErr(http.StatusNotFound, "repository not found")
		return
	}

	// Organization repositories require the owner role to delete.
	if !authorizeOrgRepo(w, r, info, "owner") {
		return
	}

	if err := gitrepo.RemoveRepository(owner, repo, info.Logo); err != nil {
		writeErr(http.StatusInternalServerError, err.Error())
		return
	}

	if err := database.DeleteRepository(owner, repo); err != nil {
		writeErr(http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"message": "Repository deleted successfully",
	})
}

// RepoHandler godoc
//
//	@Summary		Get repository details
//	@Description	Returns full repository metadata including branches, files, commits, and contributors
//	@Tags			Repositories
//	@Accept			json
//	@Produce		json
//	@Param			owner	path		string	true	"Repository owner"
//	@Param			repo	path		string	true	"Repository name"
//	@Param			branch	query		string	false	"Branch name"
//	@Success		200		{object}	gitrepo.RepoResponse
//	@Failure		404		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Router			/repos/{owner}/{repo} [get]
//
//	@Summary		Update a repository
//	@Description	Updates repository name, description, default branch, and other settings
//	@Tags			Repositories
//	@Accept			json
//	@Produce		json
//	@Param			owner	path		string				true	"Repository owner"
//	@Param			repo	path		string				true	"Repository name"
//	@Param			repo	body		UpdateRepoRequest	true	"Update details"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Router			/repos/{owner}/{repo} [patch]
//
//	@Summary		Delete a repository
//	@Description	Permanently deletes a repository and its data
//	@Tags			Repositories
//	@Produce		json
//	@Param			owner	path		string	true	"Repository owner"
//	@Param			repo	path		string	true	"Repository name"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Router			/repos/{owner}/{repo} [delete]
func RepoHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, PATCH, DELETE")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	owner := r.PathValue("owner")
	repo := r.PathValue("repo")
	// Generic ref (?ref=, branch/tag/SHA) takes precedence over the legacy
	// ?branch= parameter.
	ref := effectiveRef(r)

	if r.Method == http.MethodPatch {
		updateRepository(w, r, owner, repo)
		return
	}

	if r.Method == http.MethodDelete {
		deleteRepository(w, r, owner, repo)
		return
	}

	// Visibility is enforced by handlers.RepositoryView, which wraps every
	// /api/repos/{owner}/{repo} route at registration. Repeating the check
	// here would only add a second session round trip per request.
	w.Header().Set("Content-Type", "application/json")

	repository, err := gitrepo.GetRepo(owner, repo, ref)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(repository); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

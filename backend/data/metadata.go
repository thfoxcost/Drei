package data

import (
	"encoding/json"
	"net/http"
)

type ApiTypes struct {
	UserId        string `json:"userid"`
	Useremail     string `json:"useremail"`
	Username      string `json:"username"`
	Reponame      string `json:"reponame"`
	Description   string `json:"description"`
	Visibility    bool   `json:"visibility"`
	DefaultBranch string `json:"defaultbranch"`
}

var Current ApiTypes

func ParseRequest(r *http.Request) error {
	var req ApiTypes

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return err
	}

	Current = req
	return nil
}

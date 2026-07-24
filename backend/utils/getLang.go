package utils

import (
	"path/filepath"

	"backend/config"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing/object"
)

var extensions = map[string]string{
	".go":       "Go",
	".ts":       "TypeScript",
	".tsx":      "TypeScript",
	".js":       "JavaScript",
	".jsx":      "JavaScript",
	".mjs":      "JavaScript",
	".cjs":      "JavaScript",
	".css":      "CSS",
	".html":     "HTML",
	".htm":      "HTML",
	".md":       "Markdown",
	".markdown": "Markdown",
	".json":     "JSON",

	// A
	".abap":        "ABAP",
	".ahk":         "AutoHotkey",
	".applescript": "AppleScript",
	".as":          "ActionScript",
	".asm":         "Assembly",
	".s":           "Assembly",
	".adb":         "Ada",
	".ads":         "Ada",
	".agda":        "Agda",
	".apl":         "APL",
	".awk":         "AWK",

	// B
	".bas": "BASIC",
	".bat": "Batch file",
	".cmd": "Batch file",
	".bsh": "BeanShell",
	".sh":  "Bash",
	".boo": "Boo",

	// C
	".c":      "C",
	".h":      "C",
	".cpp":    "C++",
	".cc":     "C++",
	".cxx":    "C++",
	".hpp":    "C++",
	".cs":     "C#",
	".clj":    "Clojure",
	".cljs":   "Clojure",
	".cbl":    "COBOL",
	".cob":    "COBOL",
	".coffee": "CoffeeScript",
	".cfm":    "ColdFusion",
	".v":      "Coq/Rocq",
	".cr":     "Crystal",
	".cu":     "Cuda",
	".pyx":    "Cython",

	// D
	".d":     "D",
	".dart":  "Dart",
	".pas":   "Pascal",
	".dpr":   "Delphi",
	".dylan": "Dylan",

	// E
	".ex":       "Elixir",
	".exs":      "Elixir",
	".elm":      "Elm",
	".el":       "Emacs Lisp",
	".erl":      "Erlang",
	".hrl":      "Erlang",
	".e":        "Eiffel",
	".euphoria": "Euphoria",

	// F
	".f":      "Fortran",
	".f90":    "Fortran",
	".f95":    "Fortran",
	".for":    "Fortran",
	".fs":     "F#",
	".fsx":    "F#",
	".factor": "Factor",
	".forth":  "Forth",
	".4th":    "Forth",
	".fish":   "fish",

	// G
	".gd":     "GDScript",
	".gms":    "GAMS",
	".gml":    "Game Maker Language",
	".groovy": "Groovy",
	".gvy":    "Groovy",

	// H
	".hs":   "Haskell",
	".lhs":  "Haskell",
	".hx":   "Haxe",
	".hlsl": "HLSL",

	// I
	".icn":   "Icon",
	".idr":   "Idris",
	".io":    "Io",
	".ipynb": "Jupyter Notebook", // (Python usually, but included for reference)

	// J
	".java": "Java",
	".jl":   "Julia",
	".jsp":  "JavaServer Pages",

	// K
	".kt":  "Kotlin",
	".kts": "Kotlin",

	// L
	".lsp":  "Lisp",
	".lisp": "Lisp",
	".lgt":  "Logtalk",
	".logo": "Logo",
	".lua":  "Lua",

	// M
	".m":     "MATLAB / Objective-C",
	".mm":    "Objective-C++",
	".ml":    "OCaml",
	".mli":   "OCaml",
	".mtml":  "MtML",
	".mumps": "MUMPS",
	".mod":   "Modula-2",

	// N
	".nim": "Nim",
	".nix": "Nix",

	// O
	".p":      "Pascal",
	".pl":     "Perl",
	".pm":     "Perl",
	".php":    "PHP",
	".php3":   "PHP",
	".php4":   "PHP",
	".php5":   "PHP",
	".pony":   "Pony",
	".ps1":    "PowerShell",
	".psm1":   "PowerShell",
	".prolog": "Prolog",
	".pro":    "Prolog",
	".pd":     "Pure Data",
	".purs":   "PureScript",
	".py":     "Python",
	".pyi":    "Python",

	// Q
	".q": "Q",

	// R
	".r":     "R",
	".rkt":   "Racket",
	".rebol": "REBOL",
	".red":   "Red",
	".rex":   "REXX",
	".rexx":  "REXX",
	".rb":    "Ruby",
	".rs":    "Rust",

	// S
	".scala": "Scala",
	".sc":    "Scala",
	".scm":   "Scheme",
	".ss":    "Scheme",
	".sed":   "sed",
	".st":    "Smalltalk",
	".sml":   "Standard ML",
	".sol":   "Solidity",
	".sql":   "SQL",
	".swift": "Swift",
	".sas":   "SAS",

	// T
	".tcl":  "Tcl",
	".tex":  "TeX",
	".toit": "Toit",

	// V
	".vala": "Vala",
	".vb":   "Visual Basic",
	".vbs":  "VBScript",
	".vhd":  "VHDL",
	".vhdl": "VHDL",
	".vim":  "Vim script",
	".v++":  "Verse",

	// W
	".wasm": "WebAssembly",
	".wl":   "Wolfram Language",
	".wls":  "Wolfram Language",

	// X
	".xsl":   "XSLT",
	".xslt":  "XSLT",
	".xq":    "XQuery",
	".xtend": "Xtend",

	// Y
	".yql": "YQL",

	// Z
	".zig": "Zig",
	".zsh": "Z shell",
}

func GetLang(owner, repo string) ([]string, error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	r, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, err
	}

	head, err := r.Head()
	if err != nil {
		return nil, err
	}

	commit, err := r.CommitObject(head.Hash())
	if err != nil {
		return nil, err
	}

	tree, err := commit.Tree()
	if err != nil {
		return nil, err
	}

	seen := make(map[string]struct{})

	err = tree.Files().ForEach(func(f *object.File) error {
		ext := filepath.Ext(f.Name)

		if lang, ok := extensions[ext]; ok {
			seen[lang] = struct{}{}
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	var langs []string
	for lang := range seen {
		langs = append(langs, lang)
	}

	return langs, nil
}

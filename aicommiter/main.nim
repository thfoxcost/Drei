import dotenv
import os
import cmd/verify
import cmd/diff
import ai/preapare
import api/client
import std/strutils


proc getDir(): string =
    let argnum = paramCount()
    if argnum < 1:
        return "./"
    else:
        return paramStr(1).replace('\\', '/')

proc prepareAIMessage(diff: string, prompt: string): string =
    return prompt & "\n" & diff

proc getEnv(): (string, string, string) =
    load()
    return (getEnv("AI_API_KEY"), getEnv("API_KEY_ENDPOINT"), getEnv("MODEL"))
    


proc main() =
    let prompt = getPrompt()
    
    let dir = getDir()
    let isdirExists = dirExists(dir)
    if not isdirExists:
        echo "Error: Directory not found: ", dir
        echo "Please provide a valid directory path"
        quit(0)
    
    let (api_key, api_endpoint, model) = getEnv()
    setCurrentDir(dir) #this should be in the end cause it will change the apth of others
    verifyinit()
    verifystagin()
    let diff = getDiff()
    let msg = prepareAIMessage(diff, prompt) #combine diff and prompt

    if api_key == "" and api_endpoint == "" and model == "":  
        echo "Error: environment variable not set"
        quit(0)
    else:
        let commit_message = req(msg, api_endpoint, model, api_key)
        echo "Generated commit message:"
        echo commit_message



main()
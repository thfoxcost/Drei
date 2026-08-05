import std/[httpclient, json, os, threadpool]

var spinnerRunning = true

proc showSpinner() =
    let spinner = @["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
    var i = 0
    while spinnerRunning:
        stdout.write("\r" & spinner[i mod spinner.len] & " Generating commit message... ")
        stdout.flushFile()
        i += 1
        sleep(50)

proc req*(msg: string, api_endpoint: string, model: string, api_key: string): string =
    var client = newHttpClient()

    client.headers = newHttpHeaders({
        "Authorization": "Bearer " & api_key,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Commit Generator"
    })

    let body = %*{
        "model": model,
        "messages": [
            {"role": "user", "content": msg}
        ],
        "temperature": 0.3,
        "max_tokens": 500
    }

    spinnerRunning = true
    spawn showSpinner()

    let response = client.post(api_endpoint, $body)

    spinnerRunning = false
    sync()
    stdout.write("\r\e[K")
    stdout.flushFile()

    try:
        let jsonResponse = parseJson(response.body)
        # echo "DEBUG Response status: ", response.status
        # echo "DEBUG JSON: ", jsonResponse
        
        if jsonResponse.hasKey("error"):
            let errorMsg = jsonResponse["error"]["message"].getStr()
            raise newException(ValueError, "API error: " & errorMsg)

        return jsonResponse["choices"][0]["message"]["content"].getStr()
    except JsonParsingError:
        echo "Failed to parse JSON. Full response:"
        echo response.body
        raise
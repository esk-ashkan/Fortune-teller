import requests

invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
stream = False
models = [
    "mistralai/mistral-medium-3.5-128b",
    "mistralai/mistral-nemotron",
    "meta/llama-guard-4-12b",
]
headers = {
    "Authorization": "Bearer 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",
    "Accept": "text/event-stream" if stream else "application/json",
}

payload = {
  "messages": [
    {
      "role": "user",
      "content": "hi, do you have vision ability?"
    }
  ],
  "model": "mistralai/mistral-medium-3.5-128b",
  "reasoning_effort": "high",
  "stream": stream,
  "temperature": 0.75,
  "top_p": 1
}

response = requests.post(invoke_url, headers=headers, json=payload, stream=stream)
if stream:
    for line in response.iter_lines():
        if line:
            print(line.decode("utf-8"))
else:
    print(response.json())
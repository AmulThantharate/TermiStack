'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sendRequest, ApiResponse } from '@/lib/api';

interface LogLine {
  text: string;
  type?: 'welcome' | 'prompt' | 'error' | 'success' | 'warn' | 'cmd-line';
  isJson?: boolean;
}

const BASE_URL = 'http://localhost:8080';

export default function Terminal() {
  const [logs, setLogs] = useState<LogLine[]>([
    { text: 'TERMISTACK v2.0.0 (Next.js Edition)', type: 'welcome' },
    { text: "Type 'help' for available commands.", type: 'welcome' },
    { text: `Default Base URL: ${BASE_URL}`, type: 'welcome' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [logs]);

  const print = (text: string, type?: LogLine['type'], isJson = false) => {
    setLogs((prev) => [...prev, { text, type, isJson }]);
  };

  const printResponse = (result: ApiResponse) => {
    if (result.status === 0) {
      print('Error: Could not reach backend.', 'error');
      return;
    }
    
    const isSuccess = result.status >= 200 && result.status < 300;
    const type = isSuccess ? 'success' : 'error';
    
    if (result.status === 204) {
      print(`Status: 204 No Content (${result.time}ms) - Resource deleted successfully.`, 'success');
    } else {
      print(`Status: ${result.status} ${result.statusText} (${result.time}ms)`, type);
      if (result.data) {
        print(JSON.stringify(result.data, null, 2), undefined, true);
      }
    }
  };

  const handleCommand = async (cmdLine: string) => {
    const trimmed = cmdLine.trim();
    if (!trimmed) return;

    // Add to history
    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(history.length + 1);

    print(`api-tester@local:~$ ${cmdLine}`, 'cmd-line');

    const [cmd, ...args] = trimmed.split(' ');
    const lowerCmd = cmd.toLowerCase();

    if (lowerCmd === 'help') {
      print('Available commands:');
      print('  get <path>          - Send GET request');
      print('  post <path> <body>  - Send POST request');
      print('  put <path> <body>   - Send PUT request');
      print('  delete <path>       - Send DELETE request');
      print('  clear               - Clear terminal');
      print('  health              - Check backend health');
      print('  audits              - Show PostgreSQL audit history');
      print('  history             - Show session history');
      print('');
      print('Example: get /users');
      print('Example: audits');
      print('Example: post /users {"name": "Alice"}');
      return;
    }

    if (lowerCmd === 'clear') {
      setLogs([]);
      return;
    }

    if (lowerCmd === 'history') {
      print('Command history:');
      history.forEach((h, i) => print(`  ${i + 1}  ${h}`));
      return;
    }

    if (lowerCmd === 'health') {
      print('Checking health...');
      const result = await sendRequest('GET', `${BASE_URL}/health`);
      printResponse(result);
      return;
    }

    if (lowerCmd === 'audits') {
      print('Fetching PostgreSQL audit history...');
      const result = await sendRequest('GET', `${BASE_URL}/audits`);
      printResponse(result);
      return;
    }

    if (trimmed.startsWith('/')) {
      const url = `${BASE_URL}${trimmed}`;
      print(`Sending GET request to ${url}...`);
      const result = await sendRequest('GET', url);
      printResponse(result);
      return;
    }

    const method = lowerCmd.toUpperCase();
    if (['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
      let path = args[0];
      if (!path) {
        print(`Error: ${method} requires a path or ID.`, 'error');
        return;
      }

      if (!path.startsWith('/') && !path.startsWith('http')) {
        path = `/users/${path}`;
      }

      const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
      const bodyStr = args.slice(1).join(' ');
      let body = null;

      if (bodyStr) {
        try {
          body = JSON.parse(bodyStr);
        } catch {
          print('Error: Invalid JSON body.', 'error');
          return;
        }
      }

      print(`Sending ${method} request to ${url}...`);
      const result = await sendRequest(method, url, {}, body);
      printResponse(result);
    } else {
      print(`Command not found: ${cmd}. Type 'help' for assistance.`, 'error');
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      } else {
        setHistoryIndex(history.length);
        setInput('');
      }
    }
  };

  return (
    <div 
      className="h-full flex flex-col p-5 bg-[#0d0d0d] font-mono text-[#00ff41]"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={outputRef} className="flex-1 overflow-y-auto mb-2 space-y-1">
        {logs.map((line, i) => (
          <div key={i} className={`line ${line.type || ''}`}>
            {line.isJson ? (
              <pre className="response-json">{line.text}</pre>
            ) : (
              <span>{line.text}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center pt-2 border-t border-[#333]">
        <span className="text-[#61affe] mr-2">api-tester@local:~$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-white p-0"
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  );
}

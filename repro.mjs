import { spawn } from 'node:child_process';

const child = spawn(process.execPath, [new URL('./child.mjs', import.meta.url).pathname], {
  cwd: new URL('.', import.meta.url),
  stdio: ['ignore', 'pipe', 'inherit'],
});
let closed = false;
let timedOut = false;
let output = '';
let deadline = setTimeout(() => terminate('Child did not complete startup within 20 seconds.'), 20_000);

function terminate(message) {
  timedOut = true;
  console.error(message);
  child.kill('SIGKILL');
}

child.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  output += chunk;
  if (!closed && output.includes('server.close() resolved')) {
    closed = true;
    clearTimeout(deadline);
    deadline = setTimeout(() => {
      terminate('FAIL: child is still alive 2 seconds after server.close() resolved.');
    }, 2_000);
  }
});

child.on('error', (error) => {
  clearTimeout(deadline);
  console.error(error.message);
  process.exitCode = 1;
});

child.on('exit', (code, signal) => {
  clearTimeout(deadline);
  if (!timedOut && closed && code === 0) {
    console.log('PASS: child exited naturally after server.close().');
  } else {
    console.error(`Child exit: code=${code}, signal=${signal}`);
    process.exitCode = 1;
  }
});

const { spawn } = require('child_process');
const path = require('path');
const { writeSourceFile, getBinaryPath, cleanup } = require('../utils/fileUtils');

const COMPILE_TIMEOUT_MS = 15000; // 15s
const EXEC_TIMEOUT_MS = 5000;     // 5s
const MAX_OUTPUT_BYTES = 1024 * 512; // 512KB

/**
 * Compiles a C++ source file.
 * @returns {Promise<{success, error}>}
 */
function compileCpp(id, srcPath) {
  return new Promise((resolve) => {
    const binPath = getBinaryPath(id);
    const proc = spawn('g++', ['-std=c++17', '-O2', '-o', binPath, srcPath], {
      timeout: COMPILE_TIMEOUT_MS,
    });

    let stderr = '';
    proc.stderr.on('data', d => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, error: null, binPath });
      } else {
        let cleanStderr = stderr;
        // Clean up references to solution.cpp
        cleanStderr = cleanStderr.replace(/solution\.cpp:(\d+):(\d+):/g, 'Line $1:');
        cleanStderr = cleanStderr.replace(/solution\.cpp:(\d+):/g, 'Line $1:');
        cleanStderr = cleanStderr.replace(/solution\.cpp:/g, '');
        
        // Clean up references to temp file path (e.g. path/to/src_xxx.cpp)
        cleanStderr = cleanStderr.replace(/[^\n]*src_[^.\s]+\.cpp:(\d+):(\d+):/g, 'Line $1:');
        cleanStderr = cleanStderr.replace(/[^\n]*src_[^.\s]+\.cpp:(\d+):/g, 'Line $1:');
        
        resolve({ success: false, error: cleanStderr.trim() || 'Compilation failed', binPath: null });
      }
    });

    proc.on('error', (err) => {
      resolve({ success: false, error: `Compiler not found: ${err.message}. Ensure g++ is installed.`, binPath: null });
    });
  });
}

/**
 * Executes a compiled binary with a timeout.
 * @returns {Promise<{stdout, stderr, timedOut, exitCode}>}
 */
function executeBinary(binPath) {
  return new Promise((resolve) => {
    const proc = spawn(binPath, [], { timeout: EXEC_TIMEOUT_MS });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    proc.stdout.on('data', d => {
      stdout += d.toString();
      if (stdout.length > MAX_OUTPUT_BYTES) {
        timedOut = true; // treat as overflow
        proc.kill('SIGKILL');
      }
    });
    proc.stderr.on('data', d => { stderr += d.toString(); });

    proc.on('close', (code, signal) => {
      if (signal === 'SIGKILL' && !timedOut) timedOut = true;
      resolve({ stdout: stdout.trim(), stderr: stderr.trim(), timedOut, exitCode: code });
    });

    proc.on('error', (err) => {
      resolve({ stdout: '', stderr: err.message, timedOut: false, exitCode: -1 });
    });
  });
}

/**
 * Full pipeline: write → compile → execute → cleanup
 */
async function compileAndRun(id, sourceCode) {
  const srcPath = writeSourceFile(id, sourceCode);
  try {
    const compResult = await compileCpp(id, srcPath);
    if (!compResult.success) {
      return { ok: false, type: 'compile_error', message: compResult.error, stdout: '' };
    }

    const execResult = await executeBinary(compResult.binPath);
    if (execResult.timedOut) {
      return { ok: false, type: 'time_limit', message: 'Time Limit Exceeded (5s)', stdout: '' };
    }
    if (execResult.exitCode !== 0 && !execResult.stdout) {
      return { ok: false, type: 'runtime_error', message: execResult.stderr || 'Runtime Error', stdout: '' };
    }

    return { ok: true, type: 'success', message: '', stdout: execResult.stdout };
  } finally {
    cleanup(id);
  }
}

module.exports = { compileAndRun };

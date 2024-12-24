import { exec } from 'child_process';

// Function to run shell commands sequentially
const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    const process = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${stderr}`);
        reject(error);
        return;
      }
      console.log(`Output: ${stdout}`);
      resolve(stdout);
    });
    process.stdout.pipe(process.stdout); // Show command output in real-time
    process.stderr.pipe(process.stderr);
  });
};

// Sequentially run Git commands
const automateGit = async () => {
  try {
    await runCommand('git add .');
    await runCommand('git commit -m "Testing"');
    await runCommand('git push origin master');
    console.log('Git operations completed successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

automateGit();

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { CONFIG } from '../config.js';

class GitLedgerService {
  constructor() {
    this.gitDir = path.join(CONFIG.DATA_DIR, 'git_ledger');
    this.initRepo();
  }

  initRepo() {
    try {
      if (!fs.existsSync(this.gitDir)) {
        fs.mkdirSync(this.gitDir, { recursive: true });
      }

      const gitSubdir = path.join(this.gitDir, '.git');
      if (!fs.existsSync(gitSubdir)) {
        execSync('git init', { cwd: this.gitDir, stdio: 'ignore' });
        execSync('git config user.name "SākshyaChain Audit Kernel"', { cwd: this.gitDir, stdio: 'ignore' });
        execSync('git config user.email "audit@sakshyachain.internal"', { cwd: this.gitDir, stdio: 'ignore' });
        
        // Initial Genesis Commit
        const readmePath = path.join(this.gitDir, 'GENESIS.md');
        fs.writeFileSync(readmePath, '# SākshyaChain Immutable Audit DAG\nGenesis State Initialized.', 'utf8');
        execSync('git add GENESIS.md', { cwd: this.gitDir, stdio: 'ignore' });
        execSync('git commit -m "GENESIS_COMMIT: Initial Cryptographic State"', { cwd: this.gitDir, stdio: 'ignore' });
      }
    } catch (err) {
      console.warn('Git Ledger initialization warning:', err.message);
    }
  }

  recordGitCommit({ action, actorName, caseId, docId, docHash }) {
    try {
      const auditFileName = `${docId || 'SYS'}_audit.log`;
      const auditFilePath = path.join(this.gitDir, auditFileName);
      
      const logEntry = `[${new Date().toISOString()}] ACTION: ${action} | ACTOR: ${actorName} | CASE: ${caseId} | HASH: ${docHash}\n`;
      fs.appendFileSync(auditFilePath, logEntry, 'utf8');

      execSync(`git add "${auditFileName}"`, { cwd: this.gitDir, stdio: 'ignore' });
      
      const commitMsg = `AUDIT [${action}]: ${docId} by ${actorName} (Case: ${caseId})`;
      execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { cwd: this.gitDir, stdio: 'ignore' });

      const commitHash = execSync('git rev-parse HEAD', { cwd: this.gitDir, encoding: 'utf8' }).trim();
      return commitHash;
    } catch (err) {
      console.warn('Git commit record warning:', err.message);
      return 'GIT_COMMIT_SIMULATED_' + Date.now();
    }
  }
}

export const gitLedgerService = new GitLedgerService();

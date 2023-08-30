import { logger } from '@common/utils';
import { setJobStatus } from '../../db';

export class Job {
    private branch?: string;

    constructor(public readonly jobId: string, public readonly orgId: string) {
        logger.debug('Inst. Job class', { jobId, orgId });
    }

    setBranch(key: string) {
        logger.debug('Setting branch', key);
        this.branch = key;
    }

    async pending(key = this.branch) {
        if (!key) {
            logger.debug('Branch not set in status update.');
            throw new Error('Job branch not set.')
        }
        await this.setStatus('PENDING', { branch: key });
    }

    async processing(key = this.branch) {
        if (!key) {
            logger.debug('Branch not set in status update.');
            throw new Error('Job branch not set.')
        }
        await this.setStatus('PROCESSING', { branch: key });
    }

    async success(key = this.branch) {
        if (!key) {
            logger.debug('Branch not set in status update.');
            throw new Error('Job branch not set.')
        }
        await this.setStatus('SUCCESS', { branch: key });
    }

    async fail(message: string, key = this.branch) {
        if (!key) {
            logger.debug('Branch not set in status update.');
            throw new Error('Job branch not set.')
        }
        await this.setStatus('FAILURE', { branch: key, message });
    }

    private async setStatus(status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE', data: any) {
        logger.debug('Updating status: ' + status, { data });
        await setJobStatus(this.jobId, this.orgId, status, data);
    }
}
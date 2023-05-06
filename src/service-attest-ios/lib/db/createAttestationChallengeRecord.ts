import { IAttestationChallenge } from "../type";

export function createAttestationChallengeRecord(
    device: `Device#${string}`,
    challenge: string,
    state: string
): IAttestationChallenge {
    return {
        PK: device,
        SK: `Challenge#${challenge}`,
        entityType: 'Challenge',
        state,
        createdAt: Date.now(),
        updatedAt: null,
        deletedAt: null,
    };
}
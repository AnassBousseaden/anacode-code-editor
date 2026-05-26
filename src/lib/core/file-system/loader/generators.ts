import type { EventID, NodeID } from '$lib/core/file-system/domain/file-system-models';
import type {
	IEventIDGenerator,
	INodeIDGenerator,
	ITimestampProvider
} from '$lib/core/file-system/domain/file-system-computation-models';

/**
 * Default NodeID generator using Math.random.
 * Collision probability is negligible for practical use cases.
 */
export class RandomNodeIDGenerator implements INodeIDGenerator {
	public generate(): NodeID {
		const randomValue: number = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
		return randomValue as NodeID;
	}
}

/**
 * Default EventID generator using Math.random with hex encoding.
 */
export class RandomEventIDGenerator implements IEventIDGenerator {
	public generate(): EventID {
		const randomValue: number = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
		const hexString: string = randomValue.toString(16);
		return hexString as EventID;
	}
}

/**
 * Default timestamp provider using Date.now().
 */
export class SystemTimestampProvider implements ITimestampProvider {
	public now(): number {
		return Date.now();
	}
}

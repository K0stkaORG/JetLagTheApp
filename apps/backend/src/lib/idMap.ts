export class IdMap<IDType, T> {
	private readonly idToObjectMap: Map<IDType, T> = new Map();
	private objectIds: IDType[] = [];

	public get(id: IDType): T | undefined {
		return this.idToObjectMap.get(id);
	}

	public set(id: IDType, object: T): void {
		this.idToObjectMap.set(id, object);
		this.objectIds.push(id);
	}

	public has(id: IDType): boolean {
		return this.idToObjectMap.has(id);
	}

	public delete(id: IDType): void {
		if (!this.idToObjectMap.delete(id)) return;

		const index = this.objectIds.indexOf(id);
		if (index !== -1) this.objectIds.splice(index, 1);
	}

	public clear(): void {
		this.idToObjectMap.clear();
		this.objectIds = [];
	}

	public get count(): number {
		return this.objectIds.length;
	}

	public filter(callback: (object: T, id: IDType) => boolean): T[] {
		return this.objectIds
			.filter((id) => callback(this.idToObjectMap.get(id)!, id))
			.map((id) => this.idToObjectMap.get(id)!);
	}

	public forEach(callback: (object: T, id: IDType) => void): void {
		this.idToObjectMap.forEach((object, id) => {
			callback(object, id);
		});
	}

	public async asyncForEach(callback: (object: T, id: IDType) => Promise<void>): Promise<void> {
		for await (const id of this.objectIds) await callback(this.idToObjectMap.get(id)!, id);
	}

	public concurrentForEach(callback: (object: T, id: IDType) => Promise<void>): Promise<void> {
		return Promise.allSettled(this.objectIds.map((id) => callback(this.idToObjectMap.get(id)!, id))).then(
			(result) => {
				result.forEach((res) => {
					if (res.status === "rejected") throw new Error(res.reason);
				});
			},
		);
	}

	public map<U>(callback: (object: T, id: IDType) => U): U[] {
		return this.objectIds.map((id) => callback(this.idToObjectMap.get(id)!, id));
	}

	public async asyncMap<U>(callback: (object: T, id: IDType) => Promise<U>): Promise<U[]> {
		const results: U[] = [];

		for await (const id of this.objectIds) {
			const result = await callback(this.idToObjectMap.get(id)!, id);
			results.push(result);
		}

		return results;
	}

	public concurrentMap<U>(callback: (object: T, id: IDType) => Promise<U>): Promise<U[]> {
		return Promise.allSettled(this.objectIds.map((id) => callback(this.idToObjectMap.get(id)!, id))).then(
			(result) => {
				return result.map((res) => {
					if (res.status === "fulfilled") return res.value;

					throw new Error(res.reason);
				});
			},
		);
	}
}

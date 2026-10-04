import type { CommitDetail, Contributor } from '#lib/types.ts';

/**
 * Fetches the commits of the last 30 days and aggregates them per contributor,
 * sorted by number of contributions, most active first.
 */
export async function loadContributors(repository: string): Promise<Contributor[]> {
	const since = new Date();
	since.setDate(since.getDate() - 30);

	if (!repository) {
		return [];
	}

	const [owner, name] = repository.split('/', 2);
	if (!owner || !name) {
		return [];
	}

	const params = new URLSearchParams({ repository, since: since.toISOString() });
	const resp = await fetch(`/api/github?${params}`);
	if (resp.status != 200) {
		return [];
	}

	const commits: CommitDetail[] = await resp.json();
	if (!Array.isArray(commits)) {
		return [];
	}

	const byKey = new Map<string, Contributor>();
	for (const commit of commits) {
		const contributor = toContributor(commit);
		const key = contributorKey(contributor);
		const existing = byKey.get(key);
		if (existing) {
			existing.numberOfContributions++;
		} else {
			byKey.set(key, { ...contributor, numberOfContributions: 1 });
		}
	}

	return [...byKey.values()].sort((a, b) => b.numberOfContributions - a.numberOfContributions);
}

// commits made with an email not linked to a GitHub account have no `author`
function contributorKey(c: Contributor) {
	return c.login || c.email;
}

function toContributor(commit: CommitDetail): Contributor {
	return {
		login: commit.author?.login ?? '',
		name: commit.commit.author.name,
		avatarUrl: commit.author?.avatar_url ?? '',
		email: commit.commit.author.email,
		checked: false,
		numberOfContributions: 0
	};
}

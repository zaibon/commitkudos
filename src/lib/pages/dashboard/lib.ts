import type { CommitDetail, Contributor } from '$lib/types';

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

	const resp = await fetch(`/api/github?repository=${repository}&since=${since.toISOString()}`);
	if (resp.status != 200) {
		return [];
	}

	const commits: CommitDetail[] = await resp.json();
	if (!commits) {
		return [];
	}
	// convert commits to contributors
	let contributors = commits.map(toContributor);
	// deduplicate contributors by login
	contributors = contributors.filter((c, i, a) => a.findIndex((t) => t.login === c.login) === i);
	// count the number of comtribution for each contributor
	contributors = contributors.map((c) => ({
		...c,
		numberOfContributions: commits.filter((t) => t.author.login === c.login).length
	}));
	// sort by number of contributions ascending
	contributors = contributors.sort((a, b) => b.numberOfContributions - a.numberOfContributions);

	return contributors;
}

function toContributor(commit: CommitDetail): Contributor {
	return {
		login: commit.author?.login,
		name: commit.commit.author.name,
		avatarUrl: commit.author?.avatar_url,
		email: commit.commit.author.email,
		// twitter: commit.author?.twitter_username,
		// discord: commit.author?.login,
		checked: false,
		numberOfContributions: 0
	};
}

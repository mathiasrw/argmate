export function use(t: string) {
	return process.env.ARGMATE_STRIP ? !process.env.ARGMATE_STRIP.includes(t) : true;
}

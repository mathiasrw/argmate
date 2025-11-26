export function use(t) {
	return process.env.ARGMATE_STRIP ? !process.env.ARGMATE_STRIP.includes(t) : true;
}

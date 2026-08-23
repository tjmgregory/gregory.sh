import { handleRequest } from './handler';

export default {
	fetch(request): Response {
		return handleRequest(request);
	}
} satisfies ExportedHandler;

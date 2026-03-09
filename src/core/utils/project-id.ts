export const normalizeProjectId = (projectId: string): string =>
  projectId.trim().replace(/\.json$/i, '');

export const buildProjectIdCandidates = (projectId: string): string[] => {
  const raw = projectId || '';
  const basename = raw.split('/').pop() || raw;
  const decoded = (() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();
  const decodedBasename = decoded.split('/').pop() || decoded;

  return Array.from(
    new Set([
      normalizeProjectId(raw),
      normalizeProjectId(basename),
      normalizeProjectId(decoded),
      normalizeProjectId(decodedBasename),
    ].filter(Boolean))
  );
};

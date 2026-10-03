type DirectoryProject = {
  slug: string;
  title: string;
};

export type ProjectDirectoryState<Project extends DirectoryProject> = {
  current: Project;
  index: number;
  total: number;
  previous: Project | null;
  next: Project | null;
};

export function getProjectDirectoryState<Project extends DirectoryProject>(
  projects: readonly Project[],
  activeScene: string,
): ProjectDirectoryState<Project> {
  if (projects.length === 0) {
    throw new Error('Project directory requires at least one project.');
  }

  const activeIndex = projects.findIndex((project) => project.slug === activeScene);
  const index = activeIndex >= 0 ? activeIndex : activeScene === 'home' ? 0 : projects.length - 1;

  return {
    current: projects[index],
    index,
    total: projects.length,
    previous: index > 0 ? projects[index - 1] : null,
    next: index < projects.length - 1 ? projects[index + 1] : null,
  };
}

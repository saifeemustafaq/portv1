export class ProjectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectError';
  }
}

export class ProjectNotFoundError extends ProjectError {
  constructor(id: string) {
    super(`Project with ID ${id} not found`);
    this.name = 'ProjectNotFoundError';
  }
}

export class ProjectFetchError extends ProjectError {
  constructor(category: string, error?: string) {
    super(`Failed to fetch projects for category ${category}${error ? `: ${error}` : ''}`);
    this.name = 'ProjectFetchError';
  }
}

export class ProjectDeleteError extends ProjectError {
  constructor(id: string, error?: string) {
    super(`Failed to delete project ${id}${error ? `: ${error}` : ''}`);
    this.name = 'ProjectDeleteError';
  }
}

export class InvalidCategoryError extends ProjectError {
  constructor(category: string) {
    super(`Invalid project category: ${category}`);
    this.name = 'InvalidCategoryError';
  }
} 
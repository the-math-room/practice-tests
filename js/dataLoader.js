export async function loadJSON(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Could not load JSON file: ${path}`);
  }

  return response.json();
}

export async function loadJSONFromIndex(indexPath, basePath) {
  const fileNames = await loadJSON(indexPath);

  if (!Array.isArray(fileNames)) {
    throw new Error(`Index file must contain an array of file paths: ${indexPath}`);
  }

  return Promise.all(
    fileNames.map(fileName => loadJSON(`${basePath}/${fileName}`))
  );
}
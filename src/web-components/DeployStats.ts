export function initDeployStats() {
  const root = document.querySelector("[data-deploy-stats]");
  if (!root) return;

  const appStore = window.appStore;
  if (!appStore) {
    setError(root);
    return;
  }

  const render = () => {
    const appStore = window.appStore;
    const { loading, error, stats } = appStore.getState().deploy;

    if (loading) {
      setLoading(root);
      return;
    }

    if (error) {
      setError(root);
      return;
    }

    if (!stats) {
      setError(root);
      return;
    }

    root.querySelector("[data-run]")!.textContent = `run: #${stats.runNumber}`;
    root.querySelector("[data-duration]")!.textContent =
      `duration: ${stats.durationSeconds}s`;
    const commit = root.querySelector<HTMLAnchorElement>("[data-commit]")!;
    commit.textContent = stats.commit.slice(0, 7);
    commit.href = `https://github.com/francesco-agnoletto/francesco-agnoletto-website/commit/${stats.commit}`;
  };

  render();

  appStore.subscribe(render);
}

function setLoading(root: Element) {
  root.querySelector("[data-run]")!.textContent = "loading...";
  root.querySelector("[data-duration]")!.textContent = "loading...";
  root.querySelector("[data-commit]")!.textContent = "loading...";
}

function setError(root: Element) {
  root.querySelector("[data-run]")!.textContent = "not available.";
  root.querySelector("[data-run]")!.textContent = "not available.";
  root.querySelector("[data-run]")!.textContent = "not available.";
}

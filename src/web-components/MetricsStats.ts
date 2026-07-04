import type { CloudfrontMetrics } from "../store/types";
import { formatBytes, formatPercentage } from "../utils/format";

const selectors: string[] = [
  "[data-requests]",
  "[data-bandwidth]",
  "[data-cache]",
  "[data-latency]",
  "[data-availability]",
];

const formatMatrix: Array<[string, (value: CloudfrontMetrics) => string]> = [
  ["requests/month", (stats) => String(stats.requests)],
  ["bandwidth/month", (stats) => formatBytes(stats.bandwidth)],
  ["cache hit rate", (stats) => formatPercentage(stats.cacheHitRate)],
  ["origin latency", (stats) => `${stats.originLatency.toFixed(2)} ms`],
  ["availability", (stats) => formatPercentage(stats.availability)],
];

export function initMetricsStats() {
  const root = document.querySelector("[data-metrics-stats]");
  if (!root) return;

  const appStore = window.appStore;
  if (!appStore) {
    setError(root);
    return;
  }

  const render = () => {
    const appStore = window.appStore;
    const { loading, error, stats } = appStore.getState().metrics;

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

    selectors.map(
      (selector, index) =>
        (root.querySelector(selector)!.textContent =
          `${formatMatrix[index][0]}: ${formatMatrix[index][1](stats)}`),
    );
  };

  render();

  appStore.subscribe(render);
}

function setLoading(root: Element) {
  selectors.map(
    (selector) => (root.querySelector(selector)!.textContent = "loading..."),
  );
}

function setError(root: Element) {
  selectors.map(
    (selector) =>
      (root.querySelector(selector)!.textContent = "not available."),
  );
}

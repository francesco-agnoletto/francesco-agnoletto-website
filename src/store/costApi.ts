import { dispatch, actions } from "./index";

export async function loadCostMetrics(): Promise<void> {
  dispatch(actions.setCostLoading(true));
  dispatch(actions.setCostError(null));

  try {
    const response = await fetch("/data/cost-metrics.json");
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const stats = await response.json();

    dispatch(actions.setCostStats(stats));
  } catch (error) {
    dispatch(
      actions.setCostError(
        error instanceof Error ? error.message : String(error),
      ),
    );
  } finally {
    dispatch(actions.setCostLoading(false));
  }
}

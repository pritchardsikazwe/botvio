import { useEffect } from "react";
import { toast } from "sonner";
import {
  consumeJustUpdatedFlag,
  subscribeToUpdateState,
  checkForUpdates,
  reloadAfterUpdate,
  isBusy,
} from "@/services/appUpdateService";

/**
 * Silent-by-default update UX:
 *  - brief "Botvio updated" confirmation right after a version refresh
 *  - a non-blocking prompt only when the update can't be applied automatically
 *    (e.g. the user is mid-trade or mid-form).
 */
export const UpdateNotifier = () => {
  useEffect(() => {
    const applied = consumeJustUpdatedFlag();
    if (applied) {
      toast.success("Botvio updated", { duration: 2500 });
    }

    let notified = false;
    const unsubscribe = subscribeToUpdateState((state) => {
      if (!state.updateReady || notified) return;
      if (!isBusy()) return; // silent path handles this automatically
      notified = true;
      toast("Botvio has an update ready", {
        description: "It will be applied when your current operation is complete.",
        duration: 8000,
        action: {
          label: "Update now",
          onClick: () => reloadAfterUpdate(),
        },
      });
    });

    void checkForUpdates();
    return () => {
      unsubscribe();
    };
  }, []);

  return null;
};

export default UpdateNotifier;
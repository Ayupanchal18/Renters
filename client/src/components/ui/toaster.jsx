import * as React from "react";
import {
    Toast,
    ToastClose,
    ToastDescription,
    ToastProvider,
    ToastTitle,
    ToastViewport,
    ToastProgress,
    ToastIcon,
} from "./toast";

// Simple toast state management without external hooks
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;
const DEFAULT_TOAST_DURATION = 5000;

let count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}

const toastTimeouts = new Map();
const listeners = new Set();
let memoryState = { toasts: [] };

function dispatch(action) {
    switch (action.type) {
        case "ADD_TOAST":
            memoryState = {
                ...memoryState,
                toasts: [action.toast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
            };
            break;
        case "UPDATE_TOAST":
            memoryState = {
                ...memoryState,
                toasts: memoryState.toasts.map((t) =>
                    t.id === action.toast.id ? { ...t, ...action.toast } : t
                ),
            };
            break;
        case "DISMISS_TOAST": {
            const { toastId } = action;
            if (toastId) {
                if (!toastTimeouts.has(toastId)) {
                    const timeout = setTimeout(() => {
                        toastTimeouts.delete(toastId);
                        dispatch({ type: "REMOVE_TOAST", toastId });
                    }, TOAST_REMOVE_DELAY);
                    toastTimeouts.set(toastId, timeout);
                }
            } else {
                memoryState.toasts.forEach((toast) => {
                    if (!toastTimeouts.has(toast.id)) {
                        const timeout = setTimeout(() => {
                            toastTimeouts.delete(toast.id);
                            dispatch({ type: "REMOVE_TOAST", toastId: toast.id });
                        }, TOAST_REMOVE_DELAY);
                        toastTimeouts.set(toast.id, timeout);
                    }
                });
            }
            memoryState = {
                ...memoryState,
                toasts: memoryState.toasts.map((t) =>
                    t.id === toastId || toastId === undefined
                        ? { ...t, open: false }
                        : t
                ),
            };
            break;
        }
        case "REMOVE_TOAST":
            memoryState = {
                ...memoryState,
                toasts: action.toastId === undefined
                    ? []
                    : memoryState.toasts.filter((t) => t.id !== action.toastId),
            };
            break;
    }
    listeners.forEach((listener) => listener(memoryState));
}

export function toast(props) {
    const id = genId();
    const update = (updateProps) =>
        dispatch({ type: "UPDATE_TOAST", toast: { ...updateProps, id } });
    const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

    dispatch({
        type: "ADD_TOAST",
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open) => {
                if (!open) dismiss();
            },
        },
    });

    return { id, dismiss, update };
}

// Convenience methods for different toast variants
toast.success = (props) => toast({ ...props, variant: "success" });
toast.error = (props) => toast({ ...props, variant: "error" });
toast.warning = (props) => toast({ ...props, variant: "warning" });
toast.info = (props) => toast({ ...props, variant: "info" });

export function useToast() {
    const [state, setState] = React.useState(memoryState);

    React.useEffect(() => {
        listeners.add(setState);
        return () => {
            listeners.delete(setState);
        };
    }, []);

    return {
        ...state,
        toast,
        dismiss: (toastId) => dispatch({ type: "DISMISS_TOAST", toastId }),
    };
}

export function Toaster() {
    const { toasts } = useToast();

    return (
        <ToastProvider>
            {toasts && toasts.map(({ id, title, description, action, variant, showProgress = true, duration = DEFAULT_TOAST_DURATION, ...props }) => (
                <Toast key={id} variant={variant} showProgress={showProgress} duration={duration} {...props}>
                    <div className="flex items-start gap-3">
                        <ToastIcon variant={variant} />
                        <div className="grid gap-1">
                            {title && <ToastTitle>{title}</ToastTitle>}
                            {description && <ToastDescription>{description}</ToastDescription>}
                        </div>
                    </div>
                    {action}
                    <ToastClose />
                </Toast>
            ))}
            <ToastViewport />
        </ToastProvider>
    );
}

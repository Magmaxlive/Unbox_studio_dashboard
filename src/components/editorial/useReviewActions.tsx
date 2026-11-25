import { useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import ConfirmDialog from '../ui/ConfirmDialog'
import RejectDialog from './RejectDialog'
import { handleMutationError } from '../../utlis/handleMutationError'
import type { BlogTransition } from '../../types/Blogs'
import type { BulkNoun } from '../bulk/bulkActions'
import type { TransitionConfigMap } from './transitionConfig'

export interface TransitionVariables {
    id : string;
    transition : BlogTransition;
    reason? : string;
}

interface UseReviewActionsOptions {
    item : { id : string; title : string };
    noun : BulkNoun;
    config : TransitionConfigMap;
    isPending : boolean;
    // e.g. (vars, callbacks) => transitionMutation.mutate(vars, callbacks)
    runMutation : (
        variables:TransitionVariables,
        callbacks:{ onSuccess : () => void; onError : (error:unknown) => void },
    ) => void;
}

// Status actions for one item: confirmations, the reject flow, toasts.
// `dialogs` must be rendered OUTSIDE the Modal (its panel uses a transform,
// which would trap position:fixed children inside it).
export function useReviewActions({item, noun, config, isPending, runMutation}:UseReviewActionsOptions) {
    const [pendingConfirm, setPendingConfirm] = useState<BlogTransition | null>(null);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [rejectErrors, setRejectErrors] = useState<Record<string, string>>({});

    const resetDialogs = () => {
        setPendingConfirm(null);
        setIsRejectOpen(false);
        setRejectErrors({});
    }

    const runTransition = (transition:BlogTransition, reason?:string) => {
        runMutation({ id : item.id, transition, reason }, {
            onSuccess : ()=>{
                toast.success(config[transition].successMessage);
                resetDialogs();
            },
            onError : (error)=>{
                const isFixable = axios.isAxiosError(error) && error.response?.status === 400;

                if (transition === 'reject' && isFixable) {
                    // e.g. {"reason": ...}: keep the dialog open so it can be corrected
                    handleMutationError(error, { setFieldErrors : setRejectErrors });
                    return;
                }

                // not fixable here (e.g. 403: status already changed elsewhere)
                handleMutationError(error);
                resetDialogs();
            },
        });
    }

    const handleTransitionClick = (transition:BlogTransition) => {
        if (transition === 'reject') {
            setRejectErrors({});
            setIsRejectOpen(true);
            return;
        }
        if (config[transition].confirm) {
            setPendingConfirm(transition);
            return;
        }
        runTransition(transition);
    }

    const confirmConfig = pendingConfirm ? config[pendingConfirm].confirm : undefined;

    const dialogs = (
        <>
            {confirmConfig && pendingConfirm && (
                <ConfirmDialog
                    isOpen
                    title={confirmConfig.title}
                    description={`"${item.title}". ${confirmConfig.description}`}
                    confirmText={confirmConfig.confirmText}
                    variant={confirmConfig.variant}
                    loadingText="Working..."
                    isLoading={isPending}
                    onConfirm={()=>runTransition(pendingConfirm)}
                    onClose={()=>{ if (!isPending) setPendingConfirm(null); }}
                />
            )}

            <RejectDialog
                isOpen={isRejectOpen}
                noun={noun}
                itemTitle={item.title}
                isSubmitting={isPending}
                apiFieldErrors={rejectErrors}
                onConfirm={(reason)=>runTransition('reject', reason)}
                onClose={()=>setIsRejectOpen(false)}
            />
        </>
    );

    return {
        handleTransitionClick,
        isBusy : isPending,
        // the view shouldn't close while a dialog is on top
        isDialogOpen : Boolean(pendingConfirm) || isRejectOpen,
        dialogs,
    };
}
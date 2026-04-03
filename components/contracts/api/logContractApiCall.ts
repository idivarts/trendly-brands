import { ContractStatus, CONTRACT_STATUS_LABELS } from "@/shared-constants/contract-status";

type LogContractApiCallArgs = {
    apiState: string;
    state: ContractStatus | "Payment";
    action: string;
    contractId?: string;
};

export function logContractApiCall(args: LogContractApiCallArgs) {
    const stateLabel =
        args.state === "Payment"
            ? "Payment"
            : CONTRACT_STATUS_LABELS[args.state] ?? String(args.state);

    console.info(
        `[Contract API] apiState=${args.apiState} state=${stateLabel} action=${args.action}` +
            (args.contractId ? ` contractId=${args.contractId}` : "")
    );
}


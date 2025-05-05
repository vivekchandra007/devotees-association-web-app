import {Toast} from "primereact/toast";
//import {MessageSeverity} from "primereact/api";
import { useRef } from "react";

//type ToastSeverityType = 'success' | 'info' | 'warn' | 'error';

export default function Message() {
    const toast = useRef<Toast>(null);

    // const showToastMessage = (message: string, summary?: string, severity?: ToastSeverityType, life?: number, sticky?: boolean) => {
    //     toast.current?.show({
    //         severity: severity || MessageSeverity.ERROR,
    //         summary: (summary || MessageSeverity.ERROR).toUpperCase(),
    //         detail: message,
    //         life: life || 3000,
    //         sticky
    //     });
    // }

    return (
        <Toast ref={toast} position="bottom-left" />
    );
}
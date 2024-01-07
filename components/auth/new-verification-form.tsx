"use client"

import { newVerification } from "@/actions/new-verification";
import CardWrapper from "@/components/auth/card-wrapper"
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { BeatLoader } from "react-spinners";
import FormError from "../form-error";
import FormSuccess from "../form-success";

const NewVerificationForm = () => {
    const [error, setError] = useState<string | undefined>("");
    const [success, setsuccess] = useState<string | undefined>("");

    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const onSubmit = useCallback(() => {
        if (!token) {
            setError("Missing token!");
            return;
        }

        newVerification(token)
            .then((data) => {
                setError(data?.error);
                setsuccess(data?.success);
            })
            .catch(() => {
                setError("Somehting went wrong!");
            })

    }, [token, success, error])

    useEffect(() => {
        onSubmit();
    }, []);

    return (
        <CardWrapper
            headerLabel="Confirming your verification"
            backButtonLabel="Back to login"
            backButtonHref="/auth/login"
        >
            <div className="flex items-center w-full justify-center">
                {!success && !error && (
                    <BeatLoader />
                )}

                <FormError message={error} />
                <FormSuccess message={success} />
            </div>

        </CardWrapper>
    )
}

export default NewVerificationForm
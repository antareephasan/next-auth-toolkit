import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card"
import Header from "@/components/auth/header"
import BackButtton from "@/components/auth/back-button";
import Social from "@/components/auth/social";
interface CardWrapperPops {
    children: React.ReactNode;
    headerLabel: string;
    backButtonLabel: string;
    backButtonHref: string;
    showSocial?: boolean;
    hideBackButton?: boolean;
}


const CardWrapper = ({
    children,
    headerLabel,
    backButtonLabel,
    backButtonHref,
    showSocial,
    hideBackButton=false,
}: CardWrapperPops) => {
    return (
        <Card className="w-[400px] shadow-md">
            <CardHeader>
                <Header label={headerLabel} />
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
            {showSocial && (
                <CardFooter>
                    <Social />
                </CardFooter>
            )}

            <CardFooter>
                {!hideBackButton && (
                    <BackButtton
                        label={backButtonLabel}
                        href={backButtonHref}
                    />
                )}

            </CardFooter>
        </Card>
    )
}

export default CardWrapper
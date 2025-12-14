"use client";

import { useAuth } from "@/hooks/useAuth";
import FullPageSpinner from "@/components/FullPageSpinner";
import { TabView, TabPanel } from "primereact/tabview";
import DevoteesDashboard from "@/components/DevoteesDashboard";
import { useEffect, useState } from "react";
import { SYSTEM_ROLES } from "@/data/constants";
import { useRouter, useSearchParams } from "next/navigation";
import DonationsDashboard from "@/components/DonationsDashboard";
import ReportsDashboard from "@/components/ReportsDashboard";

export default function DevoteesPage() {
    const { isAuthenticated, systemRole } = useAuth();
    const [activeIndex, setActiveIndex] = useState<number>(0);

    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (systemRole === SYSTEM_ROLES.member) {
            router.push(`/?${searchParams || ''}`);
        }
    }, [systemRole, router, searchParams]);

    useEffect(() => {
        const initialTabIndex: string | null = searchParams.get('tab');
        if (initialTabIndex) {
            const index = parseInt(initialTabIndex, 10);
            if (!isNaN(index) && index >= 0 && index < 3) {
                setActiveIndex(index);
            }
        }
    }, [searchParams]);

    return (
        <div className="h-full w-full component-transparent">
            {
                !isAuthenticated &&
                <FullPageSpinner message="Hare Krishna! Fetching details..." />
            }
            <TabView activeIndex={activeIndex}
                onTabChange={(e) => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (params.has('tab')) {
                        params.delete('tab');
                    }
                    router.push(`/user-data?tab=${e.index}`);
                }
                }>
                <TabPanel header="Reports" leftIcon="pi pi-chart-line mr-2" className="min-w-[33vw]">
                    <ReportsDashboard />
                </TabPanel>
                <TabPanel header="Devotees" leftIcon="pi pi-users mr-2" className="min-w-[33vw]">
                    <DevoteesDashboard />
                </TabPanel>
                <TabPanel header="Donations" leftIcon="pi pi-indian-rupee mr-2" className="min-w-[33vw]">
                    <DonationsDashboard />
                </TabPanel>
            </TabView>
        </div>
    )
}
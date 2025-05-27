"use client";

import { useAuth } from "@/hooks/useAuth";
import FullPageSpinner from "@/components/FullPageSpinner";
import { TabView, TabPanel } from "primereact/tabview";
import SearchDevotee from "@/components/SearchDevotee";
import { useEffect, useState } from "react";
import { SYSTEM_ROLES } from "@/data/constants";
import { useRouter, useSearchParams } from "next/navigation";
import DonationsDashboard from "@/components/DonationsDashboard";

export default function DevoteesPage() {
    const { isAuthenticated, systemRole } = useAuth();
    const [activeIndex, setActiveIndex] = useState<number>(0);

    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (systemRole === SYSTEM_ROLES.member) {
            router.push('/');
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
            <TabView activeIndex={activeIndex} onTabChange={(e) => router.push(`/insights?tab=${e.index}`)}>
                <TabPanel header="Devotees" leftIcon="pi pi-users mr-2" className="min-w-[33vw]">
                    <SearchDevotee />
                </TabPanel>
                <TabPanel header="Donations" leftIcon="pi pi-indian-rupee mr-2" className="min-w-[33vw]">
                    <DonationsDashboard />
                </TabPanel>
                <TabPanel header="Reports" leftIcon="pi pi-chart-line mr-2" className="min-w-[33vw]">
                    <div className='p-3'>
                        <strong className="text-general">Reports Dashboard</strong>
                        <hr />
                        <small className="text-general">
                            A consolidated place for all the Reports, giving a high level view of everything. You can also create custom graphs.
                        </small>
                        <div className="min-h-screen">
                        </div>
                    </div>
                </TabPanel>
            </TabView>
        </div>
    )
}
"use client";

import { useAuth } from "@/hooks/useAuth";
import FullPageSpinner from "@/components/FullPageSpinner";
import { TabView, TabPanel } from "primereact/tabview";
import SearchDevotee from "@/components/SearchDevotee";
import { useEffect } from "react";
import { SYSTEM_ROLES } from "@/data/constants";
import { useRouter } from "next/navigation";
import DonationsDashboard from "@/components/DonationsDashboard";

export default function DevoteesPage() {
    const { isAuthenticated, systemRole } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (systemRole === SYSTEM_ROLES.member) {
            router.push('/');
        }
    },[systemRole, router]);

    return (
        <div className="h-full w-full component-transparent">
            {
                !isAuthenticated &&
                <FullPageSpinner message="Hare Krishna! Fetching details..." />
            }
            <TabView>
                <TabPanel header="Devotees" leftIcon="pi pi-users mr-2" className="min-w-[33vw]">
                    <SearchDevotee />
                </TabPanel>
                <TabPanel header="Donations" leftIcon="pi pi-indian-rupee mr-2" className="min-w-[33vw]">
                    <div className='p-3'>
                        <strong className="text-general">Donations Dashboard</strong>
                        <hr />
                        <small className="text-general">
                            A consolidated place for all the donations data
                        </small>
                        <div className="min-h-screen">
                            <DonationsDashboard />
                        </div>
                    </div>
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
"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from "next/navigation";
import FullPageSpinner from '@/components/FullPageSpinner';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import api from "@/lib/axios";              // our Custom Axios Wrapper which automatically adds access token in header
import YouTubeMosaic from '@/components/YouTubeMosaic';
import { TabView, TabPanel } from 'primereact/tabview';
import Kripa from '@/components/Kripa';
import Feed from '@/components/Feed';
import {STATUSES} from "@/data/constants";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestMode: boolean | null = searchParams.get('guest') === 'true';

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const { devotee, isAuthenticated } = useAuth();
  
  const [devoteeName, setDevoteeName] = useState<string>('');
  const [savingName, setSavingName] = useState<boolean>(false);


  async function saveDevoteeName() {
    if (devotee && devoteeName) {
      setSavingName(true);
      try {
        await api.post('/devotee', {
          id: devotee.id,
          name: devoteeName,
          status: STATUSES.active
        }); // automatically sends token
        window.location.reload();
      } catch {
        setSavingName(false);
        alert("Failed to save your name. Please try again.");
      }
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialTabIndex: string | null = searchParams.get('tab');
      if (initialTabIndex) {
        const index = parseInt(initialTabIndex, 10);
        if (!isNaN(index) && index >= 0 && index < 5) {
          setActiveIndex(index);
        }
      }
    }
  }, [searchParams]);

  useEffect(() => {
    setDevoteeName(devotee?.name? devotee.name:'');
  }, [devotee]);

  return (
    <>
      {
        !guestMode && !isAuthenticated && 
        <FullPageSpinner message="Hare Krishna! Fetching your details..." />
      }
      <TabView className="w-full home-page-tabs" activeIndex={activeIndex} 
        onTabChange={
          (e) =>  {
            const params = new URLSearchParams(searchParams.toString())
            if (params.has('tab')) {
                params.delete('tab');
            }
            const newQueryParams = params.toString();
            router.push(`/?tab=${e.index}&${newQueryParams || ''}`)
          }
        }>
        <TabPanel leftIcon="pi pi-bolt mr-2">
          <Feed />
        </TabPanel>
        <TabPanel header="Prernā" leftIcon="pi pi-youtube mr-2">
          <YouTubeMosaic />
        </TabPanel>
        <TabPanel header="Kripā" leftIcon="pi pi-sun mr-2">
          <Kripa />
        </TabPanel>
        <TabPanel header="Gyān" leftIcon="pi pi-book mr-2">
          <div className='p-3'>
            <strong className="text-general">Gyān Sindhu (Athāto Brahma Jigyāsā)</strong>
            <hr />
            <small className="text-general">
              Once you get Kripā in your life, start with the ultimate question - <strong className="text-hover">Who YOU are?</strong>. A consolidated place for all Knowledge that matters, from <strong className="text-hover">Discovering Your Self</strong> to stories of Bhakts from Grantharāj&nbsp;<strong className="text-hover">Shrimad Bhāgwatam</strong>.
            </small>
            <div className="min-h-screen">
            </div>
          </div>
        </TabPanel>
        <TabPanel header="Bhakti" leftIcon="pi pi-heart-fill mr-2">
          <div className='p-3'>
            <strong className="text-general">Bhakti Rasāmṛta Sindhu</strong>
            <hr />
            <small className="text-general">
              Finally, it&apos;s time to do practical - <strong className="text-hover">Premā Bhakti</strong>.
              <br />
              Visit temple to get drenched in the <strong className="text-hover">Nectar of Devotion</strong>
              , by taking divine darshan of <strong className="text-hover">The Lord</strong> or look out for upcoming events to physically and personally associate with fellow&nbsp;
              <strong className="text-hover">Dev</strong>otees.
            </small>
            <div className="min-h-screen">
            </div>
          </div>
        </TabPanel>
      </TabView>

      <Dialog
        header={devotee?.name? "Confirm us your name":"What should we call you?"} keepInViewport
        closeIcon="pi pi-crown"
        visible={!!devotee && (!devotee.name || devotee.status !== STATUSES.active)}
        footer={
          (
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-8 md:col-span-10 pt-4 text-justify">
                <small>
                  <strong>Note:</strong>&nbsp;Just {devotee?.name? "confirm":"tell"} us your name to get started. Fill in the rest anytime from the My Profile menu on top.
                </small>
              </div>
              <div className="col-span-4 md:col-span-2 mr-1 mt-4">
                <Button
                  className="float-right"
                  size="small"
                  type="button"
                  onClick={() => saveDevoteeName()}
                  label={savingName ? (devotee?.name? "Confirming":"Saving...") : (devotee?.name? "Confirm":"Save")}
                  icon="pi pi-save"
                  loading={savingName}
                  disabled={savingName || !devoteeName}
                  raised
                />
              </div>
            </div>
          )
        }
        onHide={() => setDevoteeName(devotee?.name || '')}>
        <div className="p-inputgroup mt-2 sm:mt-7">
          <span className="p-inputgroup-addon">
            <i className="pi pi-user"></i>
          </span>
          <span className="p-float-label">
            <InputText id="name" required maxLength={100}
              value={devoteeName}
              onChange={(e) => {
                setDevoteeName(e.target.value);
              }}
            />
            <label className="capitalize"
              htmlFor="name">{'Name'}</label>
          </span>
        </div>
      </Dialog>
    </>
  );
}
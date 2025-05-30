"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from "next/navigation";
import FullPageSpinner from '@/components/FullPageSpinner';
import { Button } from 'primereact/button';
import Referrals from '@/components/Referrals';
import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import api from "@/lib/axios";              // our Custom Axios Wrapper which automatically adds access token in header
import YouTubeMosaic from '@/components/YouTubeMosaic';
import { TabView, TabPanel } from 'primereact/tabview';
import Kripa from '@/components/kripa';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestMode: boolean | null = searchParams.get('guest') === 'true';

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const { devotee, isAuthenticated } = useAuth();
  
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);
  const [devoteeName, setDevoteeName] = useState<string>('');
  const [savingName, setSavingName] = useState<boolean>(false);


  async function saveDevoteeName() {
    if (devotee && devoteeName) {
      setSavingName(true);
      await api.post('/devotee', {
        id: devotee.id,
        name: devoteeName
      }); // automatically sends token
      window.location.reload();
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialTabIndex: string | null = searchParams.get('tab');
      if (initialTabIndex) {
        const index = parseInt(initialTabIndex, 10);
        if (!isNaN(index) && index >= 0 && index < 4) {
          setActiveIndex(index);
        }
      }
    }
  }, [searchParams]);

  return (
    <>
      {
        !guestMode && !isAuthenticated && 
        <FullPageSpinner message="Hare Krishna! Fetching your details..." />
      }
      <TabView className="w-full home-page-tabs" activeIndex={activeIndex} onTabChange={(e) => router.push(`/?tab=${e.index}`)}>
        <TabPanel header="Prernā" leftIcon="pi pi-youtube mr-2">
          <div className='p-3'>
            <strong className="text-general">Prernā Sāgar</strong>
            <hr />
            <small className="text-general">
              Start your spiritual journey by taking <strong className="text-hover">Holy Dip</strong> in this Sāgar of <strong className="text-hover">Bhakti</strong> videos, which will <strong className="text-hover">inspire</strong> you to the <strong className="text-hover">soul</strong>. Touch, 3D Touch, Click or Hover on any thumbnail to play. Press Escape, Click x button or just Click outside the video to close player.
            </small>
          </div>
          <div className="min-h-screen">
            <YouTubeMosaic />
          </div>
        </TabPanel>
        <TabPanel header="Kripā" leftIcon="pi pi-sun mr-2">
          <div className='p-3'>
            <strong className="text-general">I&apos;m feeling Kripā</strong>
            <hr />
            <small className="text-general">
              Once you get inspired, <strong className="text-hover">Kripā</strong> (divine blessing) will start showing. Let&apos;s see what <strong className="text-hover">Shloka</strong> from <strong className="text-hover">Shrimad Bhagwad Gita</strong> brings a hidden inspiration for you, today.
            </small>
            <div className="min-h-screen">
              <Kripa />
            </div>
          </div>
        </TabPanel>
        <TabPanel header="Gyān" leftIcon="pi pi-book mr-2">
          <div className='p-3'>
            <strong className="text-general">Gyān Sāgar (Athāto Brahma Jigyāsā)</strong>
            <hr />
            <small className="text-general">
              Once you Kripā in your life, start with the ultimate question - <strong className="text-hover">Who YOU are?</strong>. A consolidated place for all Knowledge that matters, from <strong className="text-hover">Discovering Your Self</strong> to stories of Bhakts from Grantharāj&nbsp;<strong className="text-hover">Shrimad Bhāgwatam</strong>.
            </small>
            <div className="min-h-screen">
            </div>
          </div>
        </TabPanel>
        <TabPanel header="Bhakti" leftIcon="pi pi-heart-fill mr-2">
          <div className='p-3'>
            <strong className="text-general">Events</strong>
            <hr />
            <small className="text-general">
              Finally, it&apos;s time to do practical - <strong className="text-hover">Prema Bhakti</strong>. Visit temple to take divine darshan of <strong className="text-hover">The Lord</strong> or look out for upcoming events to physically and personally connect with fellow&nbsp;
              <strong className="text-hover">Dev</strong>otees.
            </small>
            <div className="min-h-screen">
            </div>
          </div>
        </TabPanel>
      </TabView>

      <Dialog
        header="Referrals" keepInViewport
        visible={showReferralModal}
        onHide={() => setShowReferralModal(false)}>
        <span className="mb-5">
          <Referrals />
        </span>
      </Dialog>
      <Dialog
        header="What should we call you?" keepInViewport
        closeIcon="pi pi-crown"
        visible={!!devotee && !devotee.name}
        footer={
          (
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-8 md:col-span-10 p-4">
                <small>
                  <strong>Note:</strong>&nbsp;Just tell us your name, so that you can start using this app. Rest of the details, you can always fill later, through Profile menu on top, at your own ease.
                </small>
              </div>
              <div className="col-span-4 md:col-span-2 mr-1">
                <Button
                  className="float-right"
                  size="small"
                  type="button"
                  onClick={() => saveDevoteeName()}
                  label={savingName ? "Saving..." : "Save"}
                  icon="pi pi-save"
                  loading={savingName}
                  disabled={savingName || !devoteeName}
                  raised
                />
              </div>
            </div>
          )
        }
        onHide={() => setShowReferralModal(false)}>
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
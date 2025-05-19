"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from "next/navigation";
import FullPageSpinner from '@/components/FullPageSpinner';
import { Button } from 'primereact/button';
import ProfileCompletionMeter from '@/components/ProfileCompletionMeter';
import { Card } from 'primereact/card';
import Image from "next/image";
import Referrals from '@/components/Referrals';
import { Dialog } from 'primereact/dialog';
import { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import api from "@/lib/axios";              // our Custom Axios Wrapper

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestMode: boolean | null = !!searchParams.get('guest');
  const { devotee, isAuthenticated } = useAuth();
  const [showWelcomeCard, setShowWelcomeCard] = useState<boolean>(true);
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);
  const [devoteeName, setDevoteeName] = useState<string>('');
  const [savingName, setSavingName] = useState<boolean>(false);

  const title = (
    <small className="text-text">
      ॥ हरे कृष्ण ॥
      <br />
      {devotee?.initiated_name || devotee?.name}{devotee?.gender ? `, ${devotee.spiritual_levels[`title_${devotee?.gender}`]}` : ''} 🙏🏻
    </small>
  );

  const subTitle = (
    <small className="text-text">
      Congratulations! Thanks to your devotion, we all are now getting a new beautiful temple in Baner, Pune
    </small>
  );

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

  if (!guestMode && !isAuthenticated) return <FullPageSpinner message="Hare Krishna! Fetching your details..." />;

  return (
    <>
      <Image
        className="absolute -z-1 top-0 left-0 w-full h-full object-cover"
        src="/background.jpg"
        alt="Devotees' Association background image"
        sizes="100v"
        fill
        priority
      />
      {
        showWelcomeCard &&
        <Card title={title}
          subTitle={subTitle}
          className="shadow-2xl w-full md:w-110 text-center component-transparent text-text size-fit m-auto">
          <div>
            <div className="text-text">
              <strong className="font-bilbo md:text-2xl">Shri Shri <span className="text-5xl text-special">Radha Krishna</span>&nbsp;Temple</strong>
            </div>
            <Image
              className="m-auto"
              src="/chant-and-be-happy.png"
              alt="Devotees' Association"
              width={200}
              height={214}
              priority
            />
            <br />
            <small className="text-text">
              So, now it&apos;s your turn.
              <br />
              Let&apos;s build it brick by brick, step by step
            </small>
            <br /><br />
            <Button label="Step 1: Don't miss this once in a Lifetime Opportunity to build a temple for Shri Shri Radha Krishna. Contribute!" severity="warning" raised size="small"
              icon="pi pi-indian-rupee"
              onClick={() => window.open("https://iskconpunebcec.com/#/newtemple")} />
            <br /><br />
            <Button label="Step 2: Come, join our Whatsapp group for latest updates and spiritual association" severity="success" raised size="small"
              icon="pi pi-whatsapp"
              onClick={() => alert('Link to a Whatsapp group')} />
            <br /><br />
            {
              guestMode ?
                (
                  <>
                    <Button label="Step 3: Create Profile, Get Gifts on your special occassions, Track Your Donations and Associate with Devotees. All at one place"
                      severity="danger" size="small" raised
                      icon="pi pi-crown"
                      onClick={() => router.push(`/login${searchParams ? `?${searchParams}` : ''}`)} />
                    <br />
                  </>
                ) :
                (
                  <>
                    <Button severity="info" raised className="w-full" size="small"
                      icon="pi pi-mobile"
                      onClick={() => router.push('/devotee')}>
                      <div className="grid grid-cols-12 items-center">
                        <span className="col-span-8">Step 13: Keep your profile upto date</span>
                        <ProfileCompletionMeter devotee={devotee} className="col-span-4" />
                      </div>
                    </Button>
                    <br /><br />
                    <Button label="Step 4: Let&apos;s Spread the word. Refer Others and become a spiritual catalyst in their life." severity="secondary" raised size="small"
                      icon="pi pi-fw pi-share-alt"
                      onClick={() => setShowReferralModal(true)} />
                  </>
                )
            }
            <br /><br />
            <span className="flex flex-col items-center space-y-1">
                <Button
                    icon="pi pi-times-circle"
                    rounded
                    text
                    raised
                    severity="contrast"
                    aria-label="Close"
                    size="large"
                    onClick={() => {
                      setShowWelcomeCard(false);
                      window.scrollTo(0,0);
                    }}
                />
                <span className="text-xs mt-1">Close</span>
            </span>
          </div>
        </Card>
      }
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
        visible={!guestMode && !!devotee && !devotee.name}
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
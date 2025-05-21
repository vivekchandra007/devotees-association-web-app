"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from "next/navigation";
import FullPageSpinner from '@/components/FullPageSpinner';
import { Button } from 'primereact/button';
import ProfileCompletionMeter from '@/components/ProfileCompletionMeter';
import Image from "next/image";
import Referrals from '@/components/Referrals';
import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import api from "@/lib/axios";              // our Custom Axios Wrapper
import YouTubeMosaic from '@/components/YouTubeMosaic';
import { Checkbox } from 'primereact/checkbox';
import { TabView, TabPanel } from 'primereact/tabview';
import { classNames } from 'primereact/utils';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestMode: boolean | null = !!searchParams.get('guest');
  const { devotee, isAuthenticated } = useAuth();
  const LOCAL_STORAGE_STEPS_COMPLETED = "stepsCompleted";
  const [showWelcomeDialogue, setShowWelcomeDialogue] = useState<boolean>(true);
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);
  const [stepsCompleted, setStepsCompleted] = useState<boolean>(false);
  const [devoteeName, setDevoteeName] = useState<string>('');
  const [savingName, setSavingName] = useState<boolean>(false);

  const steps: number = guestMode ? 3 : 4;

  const title = (
    <small className="text-text">
      ॥ हरे कृष्ण ॥
      <br />
      {devotee?.initiated_name || devotee?.name}{devotee?.gender ? `, ${devotee.spiritual_levels[`title_${devotee?.gender}`]}` : ''} 🙏🏻
    </small>
  );

  const guestModeFooter = (
    <div className="w-full text-left">
      <small>
        <strong>Note: We recommed you complete all the above steps at earliest, especially Step 3 to register and create profile, to enjoy seamless and blissfull experience.</strong>
      </small>
    </div>
  )

  const footer = (
    <div className={classNames('grid items-center mt-5', stepsCompleted ? "grid-cols-12" : "")}>
      <div className={classNames('text-left', stepsCompleted ? "col-span-6" : "")}>
        <small onClick={() => setStepsCompleted(!stepsCompleted)} className="cursor-pointer">
          <Checkbox
            checked={stepsCompleted}>
          </Checkbox>
          &nbsp;&nbsp;&nbsp;I have completed all the above {steps} steps.
        </small>
      </div>
      {
        stepsCompleted &&
        <div className="col-span-6">
          <Button
            size="small"
            onClick={() => hideWelcomeMessage(true)}
            label="Don&apos;t show this message again."
            severity="danger"
            raised
          />
        </div>
      }
    </div>
  );

  function hideWelcomeMessage(stepsCompleted?: boolean) {
    setShowWelcomeDialogue(false);
    if (stepsCompleted) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_STEPS_COMPLETED, "true");
      }
    }
    console.log("In hide, stepsCompleted: " + stepsCompleted);
    window.scrollTo(0, 0);
  }

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

  function showRepetitiveWelcomeMessageInGuestMode() {
    if (typeof window !== 'undefined') {
      const stepsDone = !!Boolean(localStorage.getItem(LOCAL_STORAGE_STEPS_COMPLETED));
      if (guestMode || !stepsDone) {
        const repetiionTime = guestMode ? (1000 * 60 * 4) : (1000 * 60 * 21)        // 2 minutes in guestMode and 21 minutes in logged in mode
        // insist user to complete steps by showing welcome dialogue
        setShowWelcomeDialogue(true);
        setTimeout(() => {
          showRepetitiveWelcomeMessageInGuestMode();
        }, repetiionTime);
      }
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stepsDone = !!Boolean(localStorage.getItem(LOCAL_STORAGE_STEPS_COMPLETED));
      if (!guestMode) {
        setStepsCompleted(stepsDone);
        setShowWelcomeDialogue(!stepsDone);
        if (!stepsDone) {
          showRepetitiveWelcomeMessageInGuestMode();
        }
      } else {
        // in case of Guest Mode, always show the repetitive welcome message at coded intervals
        showRepetitiveWelcomeMessageInGuestMode();
      }
    }
  }, []);

  if (!guestMode && !isAuthenticated) return <FullPageSpinner message="Hare Krishna! Fetching your details..." />;

  return (
    <>
      <span className="flex flex-col items-center space-y-1 absolute top-[17vh] md:top-[13.5vh] right-0 md:right-2 z-10">
        <Button
          icon="pi pi-bell"
          rounded
          className="hover:animate-pulse"
          severity="secondary"
          aria-label="Steps"
          size="small"
          title="Open Welcome Page again to checkout mandatory Steps."
          onClick={() => setShowWelcomeDialogue(true)}
        />
      </span>
      <TabView className="w-full">
        <TabPanel header="" leftIcon="pi pi-youtube mr-2">
          <div className='p-3'>
            <strong className="text-general">Bhakti Sāgar</strong>
            <hr />
            <small className="text-general">
              Take <strong className="text-hover">Holy Dip</strong> in this Sāgar of Bhakti videos, which will <strong className="text-hover">inspire</strong> you to the <strong className="text-hover">soul</strong>. Touch, 3D Touch, Click or Hover on any thumbnail to play. Press Escape, Click x button or just Click outside the video to close player.
            </small>
          </div>
          <div className="min-h-screen">
            <YouTubeMosaic />
          </div>
        </TabPanel>
        <TabPanel header="" leftIcon="pi pi-sun mr-2">
          <div className='p-3'>
            <strong className="text-general">I&apos;m feeling lucky</strong>
            <hr />
            <small className="text-general">
              Let&apos;s see what lesson from <strong className="text-hover">Shrimad Bhagwad Gitā</strong> brings a hidden inspiration for you, today.
            </small>
            <div className="min-h-screen">
            </div>
          </div>
        </TabPanel>
        <TabPanel header="" leftIcon="pi pi-book mr-2">
          <div className='p-3'>
            <strong className="text-general">Gyān Sāgar</strong>
            <hr />
            <small className="text-general">
              A consolidated place for all Knowledge that matters, from <strong className="text-hover">Discovering Your Self</strong> to stories of Bhakts from Grantharāj&nbsp;<strong className="text-hover">Shrimad Bhagwatam</strong>.
            </small>
            <div className="min-h-screen">
            </div>
          </div>
        </TabPanel>
        <TabPanel header="" leftIcon="pi pi-bolt mr-2">
          <div className='p-3'>
            <strong className="text-general">Events</strong>
            <hr />
            <small className="text-general">
              Look out for upcoming events to physically and personally connect with fellow&nbsp;
              <strong className="text-hover">Dev</strong>otees
            </small>
            <div className="min-h-screen">
            </div>
          </div>
        </TabPanel>
      </TabView>

      <Dialog
        header={title} keepInViewport closeOnEscape={!guestMode}
        visible={showWelcomeDialogue}
        footer={guestMode ? guestModeFooter : (typeof window !== 'undefined' && !Boolean(localStorage.getItem(LOCAL_STORAGE_STEPS_COMPLETED)) && footer )}
        onHide={() => hideWelcomeMessage()}
        className="shadow-2xl w-full md:w-[75vw] lg:w-[45vw] text-center component-transparent text-text size-fit m-auto">
        <div>
          <small className="block text-text mb-4">
            Congratulations! Thanks to your devotion, we all are now getting a new beautiful temple in Baner, Pune
          </small>
          <div className="text-text">
            <strong className="font-bilbo md:text-4xl">Shri Shri <span className="text-7xl text-special">Radha Krishna</span>&nbsp;Temple</strong>
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
            className="w-full"
            onClick={() => window.open("https://iskconpunebcec.com/#/newtemple")} />
          <br /><br />
          <Button label="Step 2: Come, join our Whatsapp group for latest updates and spiritual association" severity="success" raised size="small"
            icon="pi pi-whatsapp"
            className="w-full"
            onClick={() => alert('Link to a Whatsapp group')} />
          <br /><br />
          {
            guestMode ?
              (
                <>
                  <Button label="Step 3: Create Profile, Get Gifts on your special occassions, Track Your Donations and Associate with Devotees. All at one place"
                    severity="danger" size="small" raised
                    icon="pi pi-crown"
                    className="w-full"
                    onClick={() => router.push(`/login${searchParams ? `?${searchParams}` : ''}`)} />
                  <br />
                </>
              ) :
              (
                <>
                  <Button severity="info" raised
                    className="w-full" size="small"
                    icon="pi pi-mobile"
                    onClick={() => router.push('/devotee')}>
                    <div className="grid grid-cols-12 items-center w-full">
                      <span className="col-span-8">Step 3: Keep your profile upto date</span>
                      <ProfileCompletionMeter devotee={devotee} className="col-span-4" />
                    </div>
                  </Button>
                  <br /><br />
                  <Button label="Step 4: Let&apos;s Spread the word. Refer Others and become a spiritual catalyst in their life." severity="secondary" raised size="small"
                    icon="pi pi-fw pi-share-alt"
                    className="w-full"
                    onClick={() => setShowReferralModal(true)} />
                </>
              )
          }
        </div>
      </Dialog>
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
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
import { Badge } from 'primereact/badge';
import Kripa from '@/components/Kripa';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { devotee, isAuthenticated } = useAuth();
  const guestMode: boolean | null = !devotee;
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
      <span className={classNames("absolute right-0 md:right-2 z-1", guestMode? 'top-[7vh] md:top-[8.8vh]' : 'top-[17vh] md:top-[13.5vh]')}>
        <Button
          rounded
          raised
          className="hover:animate-pulse"
          severity="secondary"
          aria-label="Steps"
          size="small"
          title="Open Welcome Page again to checkout mandatory Steps."
          onClick={() => setShowWelcomeDialogue(true)}
        >
          <i className="pi pi-bell cursor-pointer text-white p-overlay-badge">
            <Badge severity="danger" className="scale-50"></Badge>
          </i>
        </Button>
      </span>
      <TabView className="w-full home-page-tabs">
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
              Once you get inspired, Kripā will start showing. Let&apos;s see what <strong className="text-hover">Shloka</strong> from <strong className="text-hover">Shrimad Bhagwad Gita</strong> brings a hidden inspiration for you, today.
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
        <TabPanel header="Bhakti" leftIcon="pi pi-bolt mr-2">
          <div className='p-3'>
            <strong className="text-general">Events</strong>
            <hr />
            <small className="text-general">
              Finally, it&apos;s time to do practical - <strong className="text-hover">Bhakti</strong>. Visit temple to take divine darshan of <strong className="text-hover">The Lord</strong> or look out for upcoming events to physically and personally connect with fellow&nbsp;
              <strong className="text-hover">Dev</strong>otees.
            </small>
            <div className="min-h-screen">
            </div>
          </div>
        </TabPanel>
      </TabView>

      <Dialog
        header={title} keepInViewport closeOnEscape={!guestMode}
        visible={showWelcomeDialogue}
        footer={guestMode ? guestModeFooter : (typeof window !== 'undefined' && !Boolean(localStorage.getItem(LOCAL_STORAGE_STEPS_COMPLETED)) && footer)}
        onHide={() => hideWelcomeMessage()}
        className="shadow-2xl w-full md:w-[75vw] lg:w-[45vw] text-center text-text size-fit m-auto">
        <div>
          <small className="block text-text mb-4">
            Congratulations! Thanks to your devotion, we are getting a new beautiful temple in Baner, Pune
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
          <div className="grid grid-cols-12 items-center py-1 border-l-1 border-solid border-hover pl-2">
            <div className="col-span-8 md:col-span-10 text-left">
              <Badge severity="warning" className="scale-150 -ml-3 mr-2"></Badge>
              <small className="text-text"><strong className="text-hover">Step 1:</strong> A Once-In-A-Lifetime, divine chance to eternally serve Shri Shri Radha Krishna — build their eternal home in your area. Do Not Miss. Donate today.</small>
            </div>
            <div className="col-span-4 md:col-span-2 mr-1">
              <Button label="" severity="warning" raised size="small" className="float-right"
                icon="pi pi-indian-rupee"
                onClick={() => window.open("https://iskconpunebcec.com/#/newtemple")}>
                  <Badge severity="warning" value="▸" className="scale-150"></Badge>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-12 items-center py-1 border-l-1 border-solid border-hover pl-2">
            <div className="col-span-8 md:col-span-10 text-left">
              <Badge severity="warning" className="scale-150 -ml-3 mr-2"></Badge>
              <small className="text-text"><strong className="text-hover">Step 2:</strong> Join our Whatsapp group to stay updated with the latest news and events.</small>
            </div>
            <div className="col-span-4 md:col-span-2 mr-1">
              <Button label="" severity="success" raised size="small" className="float-right"
                icon="pi pi-whatsapp"
                onClick={() => alert('Link to a Whatsapp group')}>
                  <Badge severity="success" value="▸" className="scale-150"></Badge>
              </Button>
            </div>
          </div>
          {
            guestMode ?
              (
                <>
                  <div className="grid grid-cols-12 items-center py-1 border-l-1 border-solid border-hover pl-2">
                    <div className="col-span-8 md:col-span-10 text-left">
                      <Badge severity="warning" className="scale-150 -ml-3 mr-2"></Badge>
                      <small className="text-text"><strong className="text-hover">Step 3:</strong> Create Profile, Get Gifts on your special occassions, Track your Donations, Offer online Prayers and Associate with Devotees. All at one place.</small>
                    </div>
                    <div className="col-span-4 md:col-span-2 mr-1">
                      <Button label="" severity="danger" raised size="small" className="float-right"
                        icon="pi pi-crown"
                        onClick={() => router.push(`/login${searchParams ? `?${searchParams}` : ''}`)} >
                          <Badge severity="danger" value="▸" className="scale-150"></Badge>
                      </Button>
                    </div>
                  </div>
                </>
              ) :
              (
                <>
                  <div className="grid grid-cols-12 items-center py-1 border-l-1 border-solid border-hover pl-2">
                    <div className="col-span-8 md:col-span-10 text-left">
                      <div className="grid grid-cols-12 items-center">
                        <div className="col-span-8 md:col-span-7 text-left">
                          <Badge severity="warning" className="scale-150 -ml-3 mr-2"></Badge>
                          <small className="text-text"><strong className="text-hover">Step 3:</strong> Keep your profile 100% and upto date</small>
                        </div>
                        <div className="col-span-4 md:col-span-5">
                          <ProfileCompletionMeter devotee={devotee} />
                        </div>
                      </div>
                    </div>
                    <div className="col-span-4 md:col-span-2 mr-1">
                      <Button label="" severity="info" raised size="small" className="float-right"
                        icon="pi pi-user-edit"
                        onClick={() => router.push('/devotee')}>
                          <Badge severity="info" value="▸" className="scale-150"></Badge>
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 items-center py-1 border-l-1 border-solid border-hover pl-2">
                    <div className="col-span-8 md:col-span-10 text-left">
                      <Badge severity="warning" className="scale-150 -ml-3 mr-2"></Badge>
                      <small className="text-text"><strong className="text-hover">Step 4:</strong> Let&apos;s Spread the word. Refer Others and become a spiritual catalyst in their life.</small>
                    </div>
                    <div className="col-span-4 md:col-span-2 mr-1">
                      <Button label="" severity="secondary" raised size="small" className="float-right"
                        icon="pi pi-share-alt"
                        onClick={() => setShowReferralModal(true)} >
                          <Badge severity="secondary" value="▸" className="scale-150"></Badge>
                      </Button>
                    </div>
                  </div>
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
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  COUNTRIES, 
  ACTION_WEIGHTS, 
  DEPOSIT_AMOUNTS, 
  WITHDRAW_AMOUNTS, 
  INVESTMENT_AMOUNTS, 
  REWARD_AMOUNTS 
} from './LiveActivityNotificationData';
import { cn } from '../lib/utils';

interface ActivityItem {
  id: string;
  flag: string;
  name: string;
  actionText: string;
  amountText?: string;
  isAmountPositive?: boolean;
}

// Country weights prioritizing Nigeria, UK, US
const COUNTRY_WEIGHTS = [
  { key: "nigeria", weight: 25 },
  { key: "united_kingdom", weight: 15 },
  { key: "united_states", weight: 15 },
  { key: "uganda", weight: 5 },
  { key: "tanzania", weight: 5 },
  { key: "cameroon", weight: 5 },
  { key: "south_africa", weight: 8 },
  { key: "kenya", weight: 8 },
  { key: "singapore", weight: 8 },
  { key: "switzerland", weight: 5 },
  { key: "netherlands", weight: 5 },
  { key: "sweden", weight: 4 },
  { key: "egypt", weight: 5 },
  { key: "canada", weight: 7 },
  { key: "australia", weight: 7 },
  { key: "bangladesh", weight: 5 }
];

function getWeightedRandom<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    if (random < item.weight) {
      return item;
    }
    random -= item.weight;
  }
  return items[0];
}

const generateActivity = (): ActivityItem => {
  const countryObj = getWeightedRandom(COUNTRY_WEIGHTS);
  const country = COUNTRIES[countryObj.key];
  const randomName = country.names[Math.floor(Math.random() * country.names.length)];
  const actionObj = getWeightedRandom(ACTION_WEIGHTS);
  const action = actionObj.action;
  
  let actionText = "";
  let amountText: string | undefined;
  let isAmountPositive: boolean | undefined;

  switch (action) {
    case "joined": {
      const joinVerbs = ["Joined", "Registered"];
      actionText = joinVerbs[Math.floor(Math.random() * joinVerbs.length)];
      break;
    }
    case "checked_in": {
      actionText = "Checked In";
      amountText = "+1Point";
      isAmountPositive = true;
      break;
    }
    case "deposited": {
      const depVerbs = ["Deposited", "Funded Wallet", "Added Funds"];
      actionText = depVerbs[Math.floor(Math.random() * depVerbs.length)];
      const amtObj = getWeightedRandom(DEPOSIT_AMOUNTS);
      amountText = `$${amtObj.value.toLocaleString()}`;
      isAmountPositive = true;
      break;
    }
    case "invested": {
      const invVerbs = ["Invested", "Activated Node", "Injected Capital"];
      actionText = invVerbs[Math.floor(Math.random() * invVerbs.length)];
      const amtObj = getWeightedRandom(INVESTMENT_AMOUNTS);
      amountText = `$${amtObj.value.toLocaleString()}`;
      isAmountPositive = true;
      break;
    }
    case "claimed_reward": {
      const rewardVerbs = ["Claimed Reward", "Claimed Investment Reward", "Earned Capital Yield"];
      actionText = rewardVerbs[Math.floor(Math.random() * rewardVerbs.length)];
      const amtObj = getWeightedRandom(REWARD_AMOUNTS);
      amountText = `$${amtObj.value.toLocaleString()}`;
      isAmountPositive = true;
      break;
    }
    case "withdrawn": {
      const witVerbs = ["Withdrawn", "Settled Balance", "Transferred Out"];
      actionText = witVerbs[Math.floor(Math.random() * witVerbs.length)];
      const amtObj = getWeightedRandom(WITHDRAW_AMOUNTS);
      amountText = `$${amtObj.value.toLocaleString()}`;
      isAmountPositive = false;
      break;
    }
    case "activated_investment": {
      const actVerbs = ["Activated Investment", "Activated Node"];
      actionText = actVerbs[Math.floor(Math.random() * actVerbs.length)];
      const amtObj = getWeightedRandom(INVESTMENT_AMOUNTS);
      amountText = `$${amtObj.value.toLocaleString()}`;
      isAmountPositive = true;
      break;
    }
  }

  return {
    id: Math.random().toString(36).substring(2, 9),
    flag: country.flag,
    name: randomName,
    actionText,
    amountText,
    isAmountPositive
  };
};

const getRandomDelay = () => {
  const rand = Math.random();
  if (rand < 0.15) {
    // 15% probability: back-to-back notifications (1.5 - 3 seconds)
    return Math.floor(Math.random() * 1500) + 1500;
  } else if (rand < 0.55) {
    // 40% probability: fast interval (4 - 8 seconds)
    return Math.floor(Math.random() * 4000) + 4000;
  } else if (rand < 0.85) {
    // 30% probability: medium interval (15 - 30 seconds)
    return Math.floor(Math.random() * 15000) + 15000;
  } else {
    // 15% probability: long pause (50 - 90 seconds)
    return Math.floor(Math.random() * 40000) + 50000;
  }
};

export default function LiveActivityNotification() {
  const [activeNotification, setActiveNotification] = useState<ActivityItem | null>(null);

  useEffect(() => {
    let activeTimeout: NodeJS.Timeout;
    let nextTimeout: NodeJS.Timeout;

    const runNotificationCycle = () => {
      const newNotif = generateActivity();
      setActiveNotification(newNotif);

      // Notification stays on screen for 4.2 seconds
      activeTimeout = setTimeout(() => {
        setActiveNotification(null);
        
        const delay = getRandomDelay();
        nextTimeout = setTimeout(runNotificationCycle, delay);
      }, 4200);
    };

    // Initial load delay gets a subtle offset to load beautifully
    const initialDelay = setTimeout(runNotificationCycle, 3000);

    return () => {
      clearTimeout(initialDelay);
      clearTimeout(activeTimeout);
      clearTimeout(nextTimeout);
    };
  }, []);

  return (
    <div className="w-full flex justify-center min-h-[26px] items-center pointer-events-none select-none my-0.5">
      <AnimatePresence mode="wait">
        {activeNotification && (
          <motion.div
            key={activeNotification.id}
            initial={{ opacity: 0, y: 5, scale: 0.995, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -4, scale: 0.995, filter: 'blur(1px)' }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              opacity: { duration: 0.6 },
              filter: { duration: 0.6 }
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#04060a]/80 backdrop-blur-xl rounded-full border border-white/[0.03] shadow-[0_6px_20px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.02)] max-w-[95%] pointer-events-none select-none fixed z-[45] left-1/2 -translate-x-1/2 top-[140px] lg:top-[174px]"
          >
            <span className="text-xs shrink-0 flex items-center justify-center filter drop-shadow-sm select-none">
              {activeNotification.flag}
            </span>
            <span className="text-[10px] md:text-[11px] font-medium text-white/90 shrink-0">
              {activeNotification.name}
            </span>
            <span className="text-white/10 text-[9px] select-none mx-0.5">—</span>
            <span className="text-[9px] md:text-[10px] font-normal text-white/50 shrink-0">
              {activeNotification.actionText}
            </span>
            {activeNotification.amountText && (
              <span className={cn(
                "text-[9px] md:text-[10px] font-medium shrink-0 ml-0.5 tracking-tight",
                activeNotification.isAmountPositive ? "text-emerald-400" : "text-rose-400"
              )}>
                {activeNotification.amountText}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

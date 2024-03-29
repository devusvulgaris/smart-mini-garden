"use client";

import useStore from "@/store";
import { CONNECTION_STATUS } from "@/constants";
import CardSkeleton from "../cardSkeleton";
import { getGradient } from "@/utils";
import { Button, CircularProgress } from "@nextui-org/react";
import useMqttClient from "@/hooks";
import { type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlantWilt } from "@fortawesome/free-solid-svg-icons";

type Props = {
  children: ReactNode;
};

const ConnectionGuard = ({ children }: Props) => {
  const { connectionStatus } = useStore(
    ({ connectionStatus, temperature, humidity, moisture }) => ({
      connectionStatus,
      temperature,
      humidity,
      moisture,
    })
  );

  const { connect } = useMqttClient();

  switch (connectionStatus) {
    case CONNECTION_STATUS.CONNECTING:
      return (
        <div className="flex flex-col justify-center items-center h-full">
          <CircularProgress size="lg" />
        </div>
      );
    case CONNECTION_STATUS.CONNECTED:
      return children;
    case CONNECTION_STATUS.DISCONNECTED:
    default:
      return (
        <div className="flex flex-col justify-center items-center h-full">
          <FontAwesomeIcon
            icon={faPlantWilt}
            className="text-green-300 mb-4"
            size="4x"
          />
          <p className="text-xl mb-3">
            Client is not connected to mini garden. Please connect to device.
          </p>
          <Button
            className={`text-white font-semibold text-large bg-gradient-to-br  ${getGradient(
              "sublime"
            )}`}
            onClick={connect}
          >
            Connect
          </Button>
        </div>
      );
  }
};

export default ConnectionGuard;

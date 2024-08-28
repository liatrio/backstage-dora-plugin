import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

export interface Props {
  title: string;
  info: string;
  color?: string;
  scoreDisplay?: string;
}

const useStyles = makeStyles(() => ({
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignContent: 'center',
  },
}));

export const ChartTitle = (props: Props) => {
  const classes = useStyles();

  return (
    <>
      <div className={classes.chartHeader}>
        <span>
          {props.title}:{' '}
          <span style={{ color: props.color }}>{props.scoreDisplay ?? ''}</span>
        </span>
        <svg
          viewBox="0,0,128,128"
          width="32px"
          height="32px"
          data-tooltip-id="metric_tooltip"
          data-tooltip-content={props.info}
        >
          <g
            fill="none"
            fillRule="nonzero"
            stroke="none"
            strokeWidth="1"
            strokeLinecap="butt"
            strokeLinejoin="miter"
            strokeMiterlimit="10"
            strokeDasharray=""
            strokeDashoffset="0"
            fontFamily="none"
            fontWeight="none"
            fontSize="none"
            textAnchor="none"
            style={{ mixBlendMode: 'normal' }}
          >
            <g transform="scale(1,1)">
              <circle
                cx="64"
                cy="64"
                r="55"
                fillOpacity="0"
                fill="#ffffff"
              ></circle>
              <path
                d="M15,69.2c-1.6,0 -2.9,-1.3 -3,-2.9c0,-0.8 -0.1,-1.5 -0.1,-2.3c0,-1.7 1.3,-3 3,-3c1.7,0 3,1.3 3,3c0,0.7 0,1.4 0,2.1c0.1,1.7 -1.2,3.1 -2.9,3.1c0.1,0 0.1,0 0,0z"
                fill="#24ae1d"
              ></path>
              <path
                d="M64,116c-19.9,0 -37.8,-11.1 -46.6,-29c-0.7,-1.5 -0.1,-3.3 1.4,-4c1.5,-0.7 3.3,-0.1 4,1.4c7.8,15.8 23.6,25.6 41.2,25.6c25.4,0 46,-20.6 46,-46c0,-12.3 -4.8,-23.8 -13.5,-32.5c-1.2,-1.2 -1.2,-3.1 0,-4.2c1.2,-1.2 3.1,-1.2 4.2,0c9.9,9.8 15.3,22.8 15.3,36.7c0,28.7 -23.3,52 -52,52z"
                fill="#24ae1d"
              ></path>
              <circle
                cx="64"
                cy="39"
                r="7"
                fillOpacity="0"
                fill="#e4e4e7"
              ></circle>
              <path
                d="M57,68v24c0,3.9 3.1,7 7,7v0c3.9,0 7,-3.1 7,-7v-24c0,-3.9 -3.1,-7 -7,-7v0c-3.9,0 -7,3.1 -7,7z"
                fillOpacity="0"
                fill="#e4e4e7"
              ></path>
              <path
                d="M64,122c-32,0 -58,-26 -58,-58c0,-32 26,-58 58,-58c32,0 58,26 58,58c0,32 -26,58 -58,58zM64,12c-28.7,0 -52,23.3 -52,52c0,28.7 23.3,52 52,52c28.7,0 52,-23.3 52,-52c0,-28.7 -23.3,-52 -52,-52z"
                fill="#c1c1c1"
              ></path>
              <path
                d="M64,49c-5.5,0 -10,-4.5 -10,-10c0,-5.5 4.5,-10 10,-10c5.5,0 10,4.5 10,10c0,5.5 -4.5,10 -10,10zM64,35c-2.2,0 -4,1.8 -4,4c0,2.2 1.8,4 4,4c2.2,0 4,-1.8 4,-4c0,-2.2 -1.8,-4 -4,-4z"
                fill="#c1c1c1"
              ></path>
              <path
                d="M64,102c-5.5,0 -10,-4.5 -10,-10v-24c0,-5.5 4.5,-10 10,-10c5.5,0 10,4.5 10,10v24c0,5.5 -4.5,10 -10,10zM64,64c-2.2,0 -4,1.8 -4,4v24c0,2.2 1.8,4 4,4c2.2,0 4,-1.8 4,-4v-24c0,-2.2 -1.8,-4 -4,-4z"
                fill="#c1c1c1"
              ></path>
            </g>
          </g>
        </svg>
      </div>
    </>
  );
};

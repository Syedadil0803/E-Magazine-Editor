import {
  IBlockData,
  BasicType,
  components,
  createCustomBlock,
  getPreviewClassName,
  AdvancedType,
  mergeBlock,
} from 'easy-email-core';

import { CustomBlocksType } from '../constants';
import React from 'react';

const { Column, Section, Wrapper, Text, Image, Button } = components;

export type IVideo = IBlockData<
  {
    'background-color': string;
    padding: string;
  },
  {
    videoUrl: string;
    width: string;
    height: string;
    alt: string;
  }
>;

export const Video = createCustomBlock<IVideo>({
  name: 'Video',
  type: CustomBlocksType.VIDEO,
  validParentType: [
    BasicType.PAGE,
    BasicType.SECTION,
    AdvancedType.SECTION,
    BasicType.COLUMN,
    AdvancedType.COLUMN,
  ],
  create: payload => {
    const defaultData: IVideo = {
      type: CustomBlocksType.VIDEO,
      data: {
        value: {
          videoUrl: '',
          width: '100%',
          height: 'auto',
          alt: 'Video',
        },
      },
      attributes: {
        'background-color': '#ffffff',
        padding: '10px 0px 10px 0px',
      },
      children: [],
    };
    return mergeBlock(defaultData, payload);
  },
  render: ({ data, idx, mode }) => {
    const { videoUrl = '', width = '100%', height = 'auto', alt = 'Video' } = data.data.value;
    const attributes = data.attributes || {};

    const videoId = videoUrl && typeof videoUrl === 'string' && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))
      ? (videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1] || null)
      : null;

    const isYouTube = !!videoId;
    const hasVideoUrl = videoUrl && typeof videoUrl === 'string' && videoUrl.trim().length > 0;

    return (
      <Wrapper
        css-class={mode === 'testing' && idx !== undefined ? getPreviewClassName(idx, data.type) : ''}
        padding={attributes.padding}
        border='none'
        direction='ltr'
        text-align='center'
        background-color={attributes['background-color']}
      >
        <Section padding='0px'>
          <Column
            padding='0px'
            border='none'
            vertical-align='top'
          >
            {isYouTube && videoId ? (
              <Image
                align='center'
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt={alt || 'Video'}
                width={width || '100%'}
                height={height || 'auto'}
                href={videoUrl}
                target='_blank'
              />
            ) : hasVideoUrl ? (
              <Button
                align='center'
                padding='15px 30px'
                background-color='#1890ff'
                color='#ffffff'
                target='_blank'
                vertical-align='middle'
                border='none'
                text-align='center'
                href={videoUrl}
                border-radius='4px'
              >
                Watch Video
              </Button>
            ) : (
              <Text
                padding='10px'
                align='center'
                color='#999999'
              >
                Please add a video URL
              </Text>
            )}
          </Column>
        </Section>
      </Wrapper>
    );
  },
});

export { Panel } from './Panel';

import { Hash, List, Form } from '../code/cast'
import DATA from './data.json'

const FFMPEG_TIME_PATTERN =
  /|\d{2}:\d{2}:\d{2}(?:\.\d{3})|\d{2}:\d{2}(?:\.\d{3})|\d{2}(?:\.\d{3})/

export const ffmpeg_audio_codec: List = {
  form: 'list',
  file: 'ffmpeg',
  list: ['foo', 'bar'],
}

export const ffmpeg_subtitle_codec: List = {
  form: 'list',
  file: 'ffmpeg',
  list: ['foo', 'bar'],
}

export const ffmpeg_video_codec: List = {
  form: 'list',
  file: 'ffmpeg',
  list: ['foo', 'bar'],
}

export const something_with_enum: Form = {
  form: 'form',
  link: {
    list: { list: true, take: ['foo', 'bar'] },
    item: { take: ['hello-world'] },
  },
}

export const data_hash: Hash = {
  file: 'data',
  bond: {
    intraFrameOnly: { like: 'boolean' },
    label: { like: 'string' },
    lossless: { like: 'boolean' },
    lossy: { like: 'boolean' },
    supportsDecoding: { like: 'boolean' },
    supportsEncoding: { like: 'boolean' },
    type: { like: 'string' },
  },
  form: 'hash',
  hash: DATA as Record<string, any>,
}

export const ffmpeg_strict_option: List = {
  form: 'list',
  list: ['very', 'strict', 'normal', 'unofficial', 'experimental'],
}

export const remove_audio_from_video_with_ffmpeg_using_file_paths: Form =
  {
    form: 'form',
    link: {
      inputPath: { like: 'string' },
      outputPath: { like: 'string' },
      native: { like: 'html_div_element' },
    },
  }

export const remove_audio_from_video_with_ffmpeg: Form = {
  form: 'form',
  link: {
    input: { like: 'string', note: `The input video bytes.` },
  },
}

export const test_union: Form = {
  form: 'form',
  case: [
    { like: 'remove_audio_from_video_with_ffmpeg' },
    { like: 'remove_audio_from_video_with_ffmpeg_using_file_paths' },
  ],
}

export const add_audio_to_video_with_ffmpeg_using_file_paths: Form = {
  form: 'form',
  link: {
    audioCodec: { base: 'aac', like: 'string' },
    fit: { like: 'boolean' },
    inputAudioPath: { like: 'string' },
    inputVideoPath: { like: 'string' },
    outputPath: { like: 'string' },
  },
}

export const add_audio_to_video_with_ffmpeg: Form = {
  form: 'form',
  link: {
    audioCodec: { base: 'aac', like: 'string' },
    fit: { like: 'boolean' },
    inputAudio: { like: 'string' },
    inputVideo: { like: 'string' },
  },
}

export const convert_video_to_audio_with_ffmpeg: Form = {
  form: 'form',
  link: {
    inputPath: { like: 'string' },
    outputPath: { like: 'string' },
  },
}

export const convert_video_with_ffmpeg_base: Form = {
  form: 'form',
  link: {
    audioBitRate: { like: 'integer' },
    audioChannels: { like: 'integer' },
    audioCodec: { like: 'ffmpeg_audio_codec' },
    audioSamplingFrequency: { like: 'decimal' },
    duration: { like: 'integer' },
    endTime: {
      case: [
        {
          like: 'decimal',
          test: 'test_time_string',
        },
        {
          like: 'string',
          test: 'test_time_string',
        },
      ],
    },
    frameRate: { like: 'integer' },
    rotation: { like: 'decimal' },
    scaleHeight: { like: 'integer' },
    scaleWidth: { like: 'integer' },
    startTime: { like: 'integer' },
    strict: { like: 'boolean' },
    subtitleCodec: { like: 'ffmpeg_subtitle_codec' },
    videoBitRate: { like: 'integer' },
    videoCodec: { like: 'ffmpeg_video_codec' },
  },
}

export const convert_video_with_ffmpeg_using_file_paths: Form = {
  form: 'form',
  link: {
    inputPath: { like: 'string' },
    outputPath: { like: 'string' },
    ...convert_video_with_ffmpeg_base.link,
  },
}

export const convert_video_with_ffmpeg: Form = {
  form: 'form',
  link: {
    input: { like: 'array_buffer' },
    output: { like: 'array_buffer' },
    ...convert_video_with_ffmpeg_base.link,
  },
}

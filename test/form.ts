import { Hash, List, Form } from '../code/cast'
import DATA from './data.json'

const FFMPEG_TIME_PATTERN =
  /|\d{2}:\d{2}:\d{2}(?:\.\d{3})|\d{2}:\d{2}(?:\.\d{3})|\d{2}(?:\.\d{3})/

export const something_with_enum: Form = {
  form: 'form',
  link: {
    list: { list: true, take: ['foo', 'bar'] },
    item: { take: ['hello-world'] },
  },
}

export const data_hash: Hash = {
  bond: {
    intraFrameOnly: { like: 'boolean' },
    label: { like: 'string' },
    lossless: { like: 'boolean' },
    lossy: { like: 'boolean' },
    supportsDecoding: { like: 'boolean' },
    supportsEncoding: { like: 'boolean' },
    type: { like: 'string' },
  },
  form: 'hash' as const,
  hash: DATA as Record<string, any>,
}

export const ffmpeg_strict_option: List = {
  form: 'list' as const,
  list: ['very', 'strict', 'normal', 'unofficial', 'experimental'],
}

export const remove_audio_from_video_with_ffmpeg_using_file_paths: Form =
  {
    form: 'form' as const,
    link: {
      inputPath: { like: 'string' },
      outputPath: { like: 'string' },
    },
  }

export const remove_audio_from_video_with_ffmpeg: Form = {
  form: 'form' as const,
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
  form: 'form' as const,
  link: {
    audioCodec: { base: 'aac', like: 'string' },
    fit: { like: 'boolean' },
    inputAudioPath: { like: 'string' },
    inputVideoPath: { like: 'string' },
    outputPath: { like: 'string' },
  },
}

export const add_audio_to_video_with_ffmpeg: Form = {
  form: 'form' as const,
  link: {
    audioCodec: { base: 'aac', like: 'string' },
    fit: { like: 'boolean' },
    inputAudio: { like: 'string' },
    inputVideo: { like: 'string' },
  },
}

export const convert_video_to_audio_with_ffmpeg: Form = {
  form: 'form' as const,
  link: {
    inputPath: { like: 'string' },
    outputPath: { like: 'string' },
  },
}

export const convert_video_with_ffmpeg_base: Form = {
  form: 'form' as const,
  link: {
    audioBitRate: { like: 'integer' },
    audioChannels: { like: 'integer' },
    audioCodec: { like: 'ffmpeg_audio_codec' },
    audioSamplingFrequency: { like: 'number' },
    duration: { like: 'integer' },
    endTime: {
      case: [
        {
          like: 'number',
          test: 'test_time_string',
        },
        {
          like: 'string',
          test: 'test_time_string',
        },
      ],
    },
    frameRate: { like: 'integer' },
    rotation: { like: 'number' },
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
  form: 'form' as const,
  link: {
    inputPath: { like: 'string' },
    outputPath: { like: 'string' },
    ...convert_video_with_ffmpeg_base.link,
  },
}

export const convert_video_with_ffmpeg: Form = {
  form: 'form' as const,
  link: {
    input: { like: 'array_buffer' },
    output: { like: 'array_buffer' },
    ...convert_video_with_ffmpeg_base.link,
  },
}

// export const base_mesh = {
//   AddAudioToVideoWithFfmpeg,
//   AddAudioToVideoWithFfmpegUsingFilePaths,
//   ConvertVideoToAudioWithFfmpeg,
//   ConvertVideoWithFfmpeg,
//   ConvertVideoWithFfmpegUsingFilePaths,
//   RemoveAudioFromVideoWithFfmpeg,
//   RemoveAudioFromVideoWithFfmpegUsingFilePaths,
// }

// export default base

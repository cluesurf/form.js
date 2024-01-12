const FFMPEG_TIME_PATTERN =
  /|\d{2}:\d{2}:\d{2}(?:\.\d{3})|\d{2}:\d{2}(?:\.\d{3})|\d{2}(?:\.\d{3})/

export const RemoveAudioFromVideoWithFfmpegUsingFilePaths = {
  link: {
    inputPath: { like: 'string' },
    outputPath: { like: 'string' },
  },
}

export const RemoveAudioFromVideoWithFfmpeg = {
  link: {
    input: { like: 'string', note: `The input video bytes.` },
  },
}

export const TestUnion = {
  case: [
    { like: 'RemoveAudioFromVideoWithFfmpeg' },
    { like: 'RemoveAudioFromVideoWithFfmpegUsingFilePaths' },
  ],
}

export const TestUnionEnum = {
  case: ['foo', 'bar'],
}

export const AddAudioToVideoWithFfmpegUsingFilePaths = {
  link: {
    audioCodec: { base: 'aac', like: 'string' },
    fit: { like: 'boolean' },
    inputAudioPath: { like: 'string' },
    inputVideoPath: { like: 'string' },
    outputPath: { like: 'string' },
  },
}

export const AddAudioToVideoWithFfmpeg = {
  link: {
    audioCodec: { base: 'aac', like: 'string' },
    fit: { like: 'boolean' },
    inputAudio: { like: 'string' },
    inputVideo: { like: 'string' },
  },
}

export const ConvertVideoToAudioWithFfmpeg = {
  link: {
    inputPath: { like: 'string' },
    outputPath: { like: 'string' },
  },
}

export const ConvertVideoWithFfmpegBase = {
  link: {
    audioBitRate: { like: 'integer' },
    audioChannels: { like: 'integer' },
    audioCodec: { like: 'FfmpegAudioCodec' },
    audioSamplingFrequency: { like: 'number' },
    duration: { like: 'integer' },
    endTime: {
      case: [
        {
          like: 'number',
          test: {
            call: (x: number) => x > 0 && x < 256,
            note: 'Invalid startTime here.',
          },
        },
        {
          like: 'string',
          test: {
            call: (x: string) => !!x.match(FFMPEG_TIME_PATTERN),
            note: 'Invalid startTime here.',
          },
        },
      ],
    },
    frameRate: { like: 'integer' },
    rotation: { like: 'number' },
    scaleHeight: { like: 'integer' },
    scaleWidth: { like: 'integer' },
    startTime: { like: 'integer' },
    strict: { like: 'boolean' },
    subtitleCodec: { like: 'FfmpegSubtitleCodec' },
    videoBitRate: { like: 'integer' },
    videoCodec: { like: 'FfmpegVideoCodec' },
  },
}

export const ConvertVideoWithFfmpegUsingFilePaths = {
  link: {
    inputPath: { like: 'string' },
    outputPath: { like: 'string' },
    ...ConvertVideoWithFfmpegBase.link,
  },
}

export const ConvertVideoWithFfmpeg = {
  link: {
    input: { like: 'ArrayBuffer' },
    output: { like: 'ArrayBuffer' },
    ...ConvertVideoWithFfmpegBase.link,
  },
}

// export const baseMesh = {
//   AddAudioToVideoWithFfmpeg,
//   AddAudioToVideoWithFfmpegUsingFilePaths,
//   ConvertVideoToAudioWithFfmpeg,
//   ConvertVideoWithFfmpeg,
//   ConvertVideoWithFfmpegUsingFilePaths,
//   RemoveAudioFromVideoWithFfmpeg,
//   RemoveAudioFromVideoWithFfmpegUsingFilePaths,
// }

// export default base

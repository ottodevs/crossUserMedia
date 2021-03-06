// Copyright (c) 2014. EnglishCentral. All rights reserved.
package com.marstonstudio.crossusermedia.server.api;

import com.marstonstudio.crossusermedia.server.element.FileFormat;
import com.marstonstudio.crossusermedia.server.element.ResponseSet;
import com.marstonstudio.crossusermedia.server.util.AudioUtil;
import com.marstonstudio.crossusermedia.server.util.FileUtil;
import org.apache.log4j.Logger;
import org.glassfish.jersey.media.multipart.FormDataParam;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Path("/audio")
public class AudioREST {

    protected static final Logger logger = Logger.getLogger(AudioREST.class);

    public static Set<String> ACCEPTED_AUDIO_FORMATS = new HashSet<String>(Arrays.asList("wav", "f32le", "f32be", "mp4"));

    @GET
    @Produces({MediaType.APPLICATION_JSON})
    public Response getCheck(
            @Context HttpServletRequest hsr
    ) {
        logger.info("GET /audio");
        return Response.ok().build();
    }

    @POST
    @Produces({MediaType.APPLICATION_JSON})
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public ResponseSet postBlob(
            @Context HttpServletRequest hsr,
            @FormDataParam("payload") final InputStream payloadBlob,
            @FormDataParam("inputFormat") final String inputFormatName,
            @FormDataParam("inputCodec") final String inputCodec,
            @DefaultValue("44100") @FormDataParam("inputSampleRate") final Integer inputSampleRate,
            @DefaultValue("1") @FormDataParam("inputChannels") final Integer inputChannels
    ) throws IOException {
        logger.info("POST /audio");

        FileFormat inputFormat = FileFormat.fromString(inputFormatName);
        if(inputFormat == null) {
            throw new WebApplicationException("inputFormat is required and must be one of " + FileFormat.toEnumeratedList(), Response.Status.METHOD_NOT_ALLOWED);
        }

        byte[] inputBytes = FileUtil.decodeBlob(payloadBlob);
        File inputFile = FileUtil.getNewEmptyFile(inputFormat.getExtension());
        FileUtil.saveBytesToFile(inputFile, inputBytes);

        try {
            File outputFile = AudioUtil.convertAudioFile(inputFile, inputFormat, inputCodec, inputSampleRate, inputChannels, FileFormat.WAV);
            logger.info("encoded outputFile:" + outputFile);
            return new ResponseSet(
                    FileUtil.getAudioUrlFromFile(hsr, inputFile),
                    FileUtil.getAudioUrlFromFile(hsr, outputFile)
            );
        } catch (Exception e) {
            logger.error("Encoding Problem", e);
            throw new WebApplicationException(e);
        }

    }


}

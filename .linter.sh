#!/bin/bash
cd /home/kavia/workspace/code-generation/campusschedpro-95046-95052/main_container_for_campus_sched_pro
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi


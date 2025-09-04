/*
 * Function : parseProfileData()
 * Description: Parse the linkedin profile data
 */

function getImageUrl(imageObj) {
  if (!imageObj) {
    return "";
  }

  const { rootUrl, artifacts } = imageObj;

  if (!rootUrl || !artifacts || !artifacts.length) {
    return "";
  }

  const lastElement = artifacts[artifacts.length - 1];
  const imageUrl = `${rootUrl}${lastElement.fileIdentifyingUrlPathSegment}`;

  return imageUrl;
}

function getNested(obj, ...args) {
  return args.reduce((obj, level) => obj && obj[level], obj);
}

export const parseProfileData = (profileViewObj) => {
  var profile_obj = {};
  const { miniProfile } = profileViewObj.profile;

  profile_obj.linkedin_id = profileViewObj.entityUrn || "";
  profile_obj.firstname = profileViewObj.profile.firstName || "";
  profile_obj.lastname = profileViewObj.profile.lastName || "";
  profile_obj.profile_url =
    "https://www.linkedin.com/in/" + miniProfile.publicIdentifier;
  profile_obj.avatar_url =
    miniProfile.picture &&
    getImageUrl(miniProfile.picture["com.linkedin.common.VectorImage"]);

  profile_obj.country = profileViewObj.profile.geoCountryName || "";
  profile_obj.location = profileViewObj.profile.geoLocationName || "";
  profile_obj.number_of_connections = "";
  profile_obj.about = profileViewObj.profile.summary || "";
  profile_obj.headline = profileViewObj.profile.headline || "";
  profile_obj.industryName = profileViewObj.profile.industryName || "";

  profile_obj.job_history = [];
  var positionGroupView = profileViewObj.positionGroupView;
  if (
    positionGroupView &&
    positionGroupView["elements"] &&
    positionGroupView["elements"].length > 0
  ) {
    var company_arr = positionGroupView["elements"];
    for (var i2 = 0; i2 < company_arr.length; i2++) {
      var positions = company_arr[i2]["positions"];

      for (const positions_obj of positions) {
        var company_obj = {};

        company_obj["position"] = positions_obj["title"];
        company_obj["company_name"] = positions_obj["companyName"];

        var timePeriod_obj = positions_obj["timePeriod"] || {};

        if (typeof timePeriod_obj.startDate != "undefined") {
          company_obj["date_from"] = timePeriod_obj.startDate;
        }
        if (typeof timePeriod_obj.endDate != "undefined") {
          company_obj["date_to"] = timePeriod_obj.endDate;
        }

        var logo_url = "";
        var linkedin_url = "";
        var miniCompany = company_arr[i2]["miniCompany"] || {};
        var logo_obj = miniCompany["logo"];
        var universalName = miniCompany["universalName"];
        if (
          logo_obj &&
          typeof logo_obj["com.linkedin.common.VectorImage"] != "undefined"
        ) {
          logo_url = getImageUrl(logo_obj["com.linkedin.common.VectorImage"]);
        }

        if (universalName) {
          linkedin_url = "https://www.linkedin.com/company/" + universalName;
        }
        company_obj["logo_url"] = logo_url;
        company_obj["linkedin_url"] = linkedin_url;
        profile_obj.job_history.push(company_obj);
      }
    }
  }

  profile_obj.education_history = [];
  var educationView = profileViewObj.educationView;
  if (
    educationView &&
    educationView["elements"] &&
    educationView["elements"].length > 0
  ) {
    var education_arr = educationView["elements"];
    for (var i3 = 0; i3 < education_arr.length; i3++) {
      var education_obj = {};
      education_obj["major_program_certificate"] =
        education_arr[i3]["degreeName"] || "";
      education_obj["field_of_study"] = education_arr[i3]["fieldOfStudy"] || "";
      education_obj["school_name"] = education_arr[i3]["schoolName"] || "";

      var timePeriod_obj = education_arr[i3]["timePeriod"] || {};

      if (typeof timePeriod_obj.startDate != "undefined") {
        education_obj["date_from"] = timePeriod_obj.startDate;
      }
      if (typeof timePeriod_obj.endDate != "undefined") {
        education_obj["date_to"] = timePeriod_obj.endDate;
      }

      var logo_url = "";
      var linkedin_url = "";
      var school = education_arr[i3]["school"] || {};
      var logo_obj = school["logo"] || {};
      var miniSchool = school["entityUrn"] || "";
      if (
        logo_obj &&
        typeof logo_obj["com.linkedin.common.VectorImage"] != "undefined"
      ) {
        logo_url = getImageUrl(logo_obj["com.linkedin.common.VectorImage"]);
      }

      miniSchool = miniSchool.replace("urn:li:fs_miniSchool:", "");
      if (miniSchool) {
        linkedin_url = "https://www.linkedin.com/school/" + miniSchool;
      }
      education_obj["logo_url"] = logo_url;
      education_obj["linkedin_url"] = linkedin_url;
      profile_obj.education_history.push(education_obj);
    }
  }

  return profile_obj;
};

export const parseConnection = (connection) => {
  const {
    connectedMemberResolutionResult: data,
    entityUrn,
    createdAt,
  } = connection;

  const imageObj = getNested(
    data,
    "profilePicture",
    "displayImageReference",
    "vectorImage"
  );

  const avatar_url = getImageUrl(imageObj);

  return {
    avatar_url,
    full_name: `${data.firstName} ${data.lastName}`,
    profile_id: data.publicIdentifier,
    linkedin_id: entityUrn.replace("urn:li:fsd_connection:", ""),
    created_at: new Date(createdAt),
  };
};

export const parseCompanyData = (companyViewObj) => {
  const profile_obj = {};
  profile_obj.name = companyViewObj.name;
  profile_obj.logo_url =
    companyViewObj.logo &&
    companyViewObj.logo.image &&
    getImageUrl(companyViewObj.logo.image["com.linkedin.common.VectorImage"]);

  profile_obj.description = companyViewObj.description;
  profile_obj.industry =
    companyViewObj.companyIndustries &&
    companyViewObj.companyIndustries.length &&
    companyViewObj.companyIndustries[0] &&
    companyViewObj.companyIndustries[0].localizedName
      ? companyViewObj.companyIndustries[0].localizedName
      : null;
  profile_obj.location =
    companyViewObj.headquarter && companyViewObj.headquarter.country
      ? companyViewObj.headquarter.country
      : null;
  profile_obj.size = companyViewObj.staffCount
    ? companyViewObj.staffCount
    : null;
  profile_obj.website = companyViewObj.companyPageUrl
    ? companyViewObj.companyPageUrl
    : null;
  profile_obj.type =
    companyViewObj.companyType && companyViewObj.companyType.localizedName
      ? companyViewObj.companyType.localizedName
      : null;
  return profile_obj;
};

export const parseJobs = (jobViewObj) => {
  const { jobPostingResolutionResult: job } =
    jobViewObj.hitInfo["com.linkedin.voyager.deco.jserp.WebSearchJobJserpLite"];

  const company = job.companyDetails[
    "com.linkedin.voyager.deco.jserp.WebJobPostingWithCompanyName"
  ]
    ? {
        name: job.companyDetails[
          "com.linkedin.voyager.deco.jserp.WebJobPostingWithCompanyName"
        ].companyResolutionResult.name,
        logo:
          job.companyDetails[
            "com.linkedin.voyager.deco.jserp.WebJobPostingWithCompanyName"
          ].companyResolutionResult.logo &&
          job.companyDetails[
            "com.linkedin.voyager.deco.jserp.WebJobPostingWithCompanyName"
          ].companyResolutionResult.logo.image &&
          job.companyDetails[
            "com.linkedin.voyager.deco.jserp.WebJobPostingWithCompanyName"
          ].companyResolutionResult.logo.image[
            "com.linkedin.common.VectorImage"
          ]
            ? `${job.companyDetails["com.linkedin.voyager.deco.jserp.WebJobPostingWithCompanyName"].companyResolutionResult.logo.image["com.linkedin.common.VectorImage"].rootUrl}${job.companyDetails["com.linkedin.voyager.deco.jserp.WebJobPostingWithCompanyName"].companyResolutionResult.logo.image["com.linkedin.common.VectorImage"].artifacts[0].fileIdentifyingUrlPathSegment}`
            : "",
      }
    : {
        name: job.companyDetails[
          "com.linkedin.voyager.jobs.JobPostingCompanyName"
        ].companyName,
        logo: null,
      };

  const job_obj = {
    id: job.jobPostingId,
    title: job.title,
    location: job.formattedLocation && job.formattedLocation,
    remote: job.workRemoteAllowed,
    company,
  };

  return job_obj;
};

export const parseDeepFetch = (profilesArr, avatarsArr) => {
  return profilesArr.map((p) => {
    const data = p;

    let avatar;
    let imageReference;

    if (data.image.attributes.length) {
      imageReference = getNested(
        data.image.attributes[0],
        "detailDataUnion",
        "profilePicture"
      );
    }

    const avatarObj = avatarsArr.find((a) => a.entityUrn === imageReference);

    if (avatarObj) {
      const vectorImage = getNested(
        avatarObj,
        "profilePicture",
        "displayImageReference",
        "vectorImage"
      );

      avatar = getImageUrl(vectorImage);
    }

    const id = p.navigationUrl.split("/in/")[1].split("?miniProfile")[0];

    return {
      id,
      avatar,
      name: data.title.text, // OK
      work: data.primarySubtitle.text,
      location: data.secondarySubtitle.text,
      isRaw: true,
    };
  });
};

export const parseWorkExperience = (experience) => {
  return experience
    .filter((e) => e.company && e.company.miniCompany)
    .map((e) => {
      var company_obj = {};

      company_obj["position"] = e["title"];
      company_obj["company_name"] = e["companyName"];

      var timePeriod_obj = e["timePeriod"] || {};

      if (typeof timePeriod_obj.startDate != "undefined") {
        company_obj["date_from"] = timePeriod_obj.startDate;
      }
      if (typeof timePeriod_obj.endDate != "undefined") {
        company_obj["date_to"] = timePeriod_obj.endDate;
      }

      var logo_url = "";
      var linkedin_url = "";
      var miniCompany = e["company"]["miniCompany"] || {};
      var logo_obj = miniCompany["logo"];
      var universalName = miniCompany["universalName"];
      if (
        logo_obj &&
        typeof logo_obj["com.linkedin.common.VectorImage"] != "undefined"
      ) {
        logo_url = getImageUrl(logo_obj["com.linkedin.common.VectorImage"]);
      }

      if (universalName) {
        linkedin_url = "https://www.linkedin.com/company/" + universalName;
      }
      company_obj["logo_url"] = logo_url;
      company_obj["linkedin_url"] = linkedin_url;

      return company_obj;
    });
};

export const websiteToDomainParser = (url, keepPath) => {
  if (typeof url !== "string") return null;

  if (url.includes("www")) {
    const withoutBeginning = url.slice(url.indexOf("www.") + 4);
    if (keepPath) {
      return withoutBeginning;
    } else {
      return withoutBeginning.split("/")[0];
    }
  }

  if (url.includes("https://")) {
    const withoutBeginning = url.slice(url.indexOf("https://") + 8);
    if (keepPath) {
      return withoutBeginning;
    } else {
      return withoutBeginning.split("/")[0];
    }
  }

  if (url.includes("http://")) {
    const withoutBeginning = url.slice(url.indexOf("http://") + 7);
    if (keepPath) {
      return withoutBeginning;
    } else {
      return withoutBeginning.split("/")[0];
    }
  }

  if (keepPath) {
    return url;
  } else {
    return url.split("/")[0];
  }
};
